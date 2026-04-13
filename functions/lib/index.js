"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillCompletedAtMs = exports.backfillParticipantProfiles = exports.triggerStatsRefresh = exports.onUserChange = exports.sendSignInEmail = exports.validateBetaCode = exports.walletSignIn = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const nacl = __importStar(require("tweetnacl"));
const bs58_1 = __importDefault(require("bs58"));
const nodemailer = __importStar(require("nodemailer"));
admin.initializeApp();
// SMTP secrets — set via: firebase functions:secrets:set SMTP_HOST, etc.
const smtpHost = (0, params_1.defineSecret)("SMTP_HOST");
const smtpPort = (0, params_1.defineSecret)("SMTP_PORT");
const smtpUser = (0, params_1.defineSecret)("SMTP_USER");
const smtpPass = (0, params_1.defineSecret)("SMTP_PASS");
const smtpFrom = (0, params_1.defineSecret)("SMTP_FROM");
/**
 * Wallet sign-in — creates a persistent Firebase identity linked to a Solana wallet.
 * Verifies the wallet signature server-side, then either finds the existing user
 * or creates a new one. Returns a custom token for signInWithCustomToken().
 */
exports.walletSignIn = (0, https_1.onCall)(async (request) => {
    const { walletAddress, signature, message } = request.data ?? {};
    if (!walletAddress || typeof walletAddress !== "string") {
        throw new https_1.HttpsError("invalid-argument", "walletAddress is required.");
    }
    if (!signature || !Array.isArray(signature)) {
        throw new https_1.HttpsError("invalid-argument", "signature is required.");
    }
    if (!message || typeof message !== "string") {
        throw new https_1.HttpsError("invalid-argument", "message is required.");
    }
    // Decode the wallet public key from base58
    let pubkeyBytes;
    try {
        pubkeyBytes = bs58_1.default.decode(walletAddress);
    }
    catch {
        throw new https_1.HttpsError("invalid-argument", "Invalid wallet address.");
    }
    if (pubkeyBytes.length !== 32) {
        throw new https_1.HttpsError("invalid-argument", "Invalid wallet address length.");
    }
    // Reject stale signatures — prevent replay attacks (5 minute window)
    const timestampMatch = message.match(/at (\d+)$/);
    if (!timestampMatch) {
        throw new https_1.HttpsError("invalid-argument", "Invalid message format.");
    }
    const messageTimestamp = Number(timestampMatch[1]);
    const ageMs = Date.now() - messageTimestamp;
    if (ageMs < 0 || ageMs > 5 * 60 * 1000) {
        throw new https_1.HttpsError("unauthenticated", "Signature expired.");
    }
    // Verify the signature
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = new Uint8Array(signature);
    const valid = nacl.sign.detached.verify(messageBytes, signatureBytes, pubkeyBytes);
    if (!valid) {
        throw new https_1.HttpsError("unauthenticated", "Invalid wallet signature.");
    }
    const firestore = admin.firestore();
    const walletIndexRef = firestore.doc(`walletIndex/${walletAddress}`);
    // Check if this wallet is already linked to a user
    const walletDoc = await walletIndexRef.get();
    let uid;
    if (walletDoc.exists) {
        uid = walletDoc.data().uid;
    }
    else {
        // Create a new Firebase user for this wallet
        const newUser = await admin.auth().createUser({
            displayName: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        });
        uid = newUser.uid;
        // Atomic batch write — both docs or neither
        const batch = firestore.batch();
        batch.set(walletIndexRef, {
            uid,
            walletAddress,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        batch.set(firestore.doc(`users/${uid}`), {
            walletAddress,
            betaValidated: false,
            onboardingComplete: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        try {
            await batch.commit();
        }
        catch (err) {
            // If batch fails because walletIndex was created by a concurrent request, read the existing uid
            const retryDoc = await walletIndexRef.get();
            if (retryDoc.exists) {
                // Clean up the orphaned Auth user we just created
                await admin.auth().deleteUser(uid).catch(() => { });
                uid = retryDoc.data().uid;
            }
            else {
                throw err; // Real error
            }
        }
    }
    // Create and return a custom token
    const token = await admin.auth().createCustomToken(uid);
    return { token };
});
/**
 * Validate a beta code — atomically marks the code as used AND sets betaValidated
 * on the user doc in a single Firestore transaction. This prevents codes from being
 * burned without the user getting validated.
 */
exports.validateBetaCode = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const code = request.data?.code;
    if (!code || typeof code !== "string" || code.length !== 6) {
        throw new https_1.HttpsError("invalid-argument", "A 6-character beta code is required.");
    }
    const firestore = admin.firestore();
    const codeRef = firestore.doc(`betaCodes/${code.toUpperCase()}`);
    const userRef = firestore.doc(`users/${uid}`);
    await firestore.runTransaction(async (tx) => {
        const codeSnap = await tx.get(codeRef);
        if (!codeSnap.exists || codeSnap.data()?.used) {
            throw new https_1.HttpsError("not-found", "Invalid or expired beta code");
        }
        // Mark code as used
        tx.update(codeRef, {
            used: true,
            usedBy: uid,
            usedAt: new Date().toISOString(),
        });
        // Set betaValidated on user doc (create if missing)
        tx.set(userRef, {
            betaValidated: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
    return { success: true };
});
/**
 * Send a branded sign-in email with a magic link.
 * Uses Admin SDK to generate the link + nodemailer for custom HTML email.
 * Rate limited: 1 email per 60s per address.
 */
exports.sendSignInEmail = (0, https_1.onCall)({ secrets: [smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom] }, async (request) => {
    const email = request.data?.email;
    if (!email || typeof email !== "string" || !/^.+@.+\..+$/.test(email)) {
        throw new https_1.HttpsError("invalid-argument", "A valid email is required.");
    }
    const continueUrl = request.data?.continueUrl;
    if (!continueUrl || typeof continueUrl !== "string") {
        throw new https_1.HttpsError("invalid-argument", "continueUrl is required.");
    }
    // Validate continueUrl origin to prevent open-redirect attacks
    const allowedOrigins = ["https://stride-a333e.web.app", "https://stride-a333e.firebaseapp.com"];
    try {
        const url = new URL(continueUrl);
        if (!allowedOrigins.includes(url.origin)) {
            throw new https_1.HttpsError("invalid-argument", "Invalid redirect URL.");
        }
    }
    catch {
        throw new https_1.HttpsError("invalid-argument", "Invalid redirect URL.");
    }
    // Rate limit: 1 email per 60s per address
    const firestore = admin.firestore();
    const rateLimitRef = firestore.doc(`_rateLimit/email_${email.toLowerCase()}`);
    const rateLimitSnap = await rateLimitRef.get();
    if (rateLimitSnap.exists) {
        const lastSent = rateLimitSnap.data()?.timestamp?.toMillis?.() ?? 0;
        if (Date.now() - lastSent < 60_000) {
            throw new https_1.HttpsError("resource-exhausted", "Please wait before requesting another email.");
        }
    }
    // Generate the sign-in link via Admin SDK
    const actionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: true,
    };
    let signInLink;
    try {
        signInLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
    }
    catch (err) {
        console.error("generateSignInWithEmailLink failed:", err);
        throw new https_1.HttpsError("internal", "Failed to generate sign-in link.");
    }
    // Send branded email
    const transporter = nodemailer.createTransport({
        host: smtpHost.value(),
        port: Number(smtpPort.value()) || 587,
        secure: Number(smtpPort.value()) === 465,
        auth: {
            user: smtpUser.value(),
            pass: smtpPass.value(),
        },
    });
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Courier New',monospace;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <div style="font-size:28px;font-weight:bold;color:#ff6600;letter-spacing:6px;text-transform:uppercase;">
                STRIDE
              </div>
              <div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:3px;text-transform:uppercase;margin-top:6px;">
                Training Operating System
              </div>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="border:1px solid rgba(255,255,255,0.15);padding:32px 28px;background-color:rgba(255,255,255,0.02);">
              <div style="font-size:16px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">
                System Access Requested
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:28px;">
                Tap below to authenticate and enter the system.
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${signInLink}" target="_blank"
                       style="display:inline-block;background-color:#ff6600;color:#000000;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;padding:14px 40px;text-decoration:none;border:2px solid #ff6600;">
                      Authenticate →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:9px;color:rgba(255,255,255,0.3);line-height:1.6;">
                  This link expires in 1 hour.<br>
                  If you didn't request access, ignore this message.
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <div style="font-size:8px;color:rgba(255,255,255,0.2);letter-spacing:1px;text-transform:uppercase;">
                Stride Fitness Systems · Secure Authentication Protocol
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    const textEmail = `STRIDE — System Access

Tap the link below to authenticate:
${signInLink}

This link expires in 1 hour.
If you didn't request access, ignore this message.`;
    try {
        await transporter.sendMail({
            from: `"STRIDE" <${smtpFrom.value()}>`,
            to: email,
            subject: "STRIDE — Authenticate",
            text: textEmail,
            html: htmlEmail,
        });
    }
    catch (err) {
        console.error("sendMail failed:", err);
        throw new https_1.HttpsError("internal", "Failed to send email.");
    }
    // Update rate limit
    await rateLimitRef.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true };
});
// ============================================================
// Platform Stats Aggregation
// ============================================================
/**
 * Aggregate real platform stats from Firestore collections.
 * Writes to platformStats/current — publicly readable for the landing page.
 */
async function aggregateStats() {
    const firestore = admin.firestore();
    // Use Firestore count() aggregation queries instead of full document scans
    const totalOperators = (await firestore.collection("users").count().get()).data().count;
    const activeOperators = (await firestore.collection("users")
        .where("onboardingComplete", "==", true).count().get()).data().count;
    // Use collectionGroup queries with count() for subcollection aggregation
    const totalWorkoutLogs = (await firestore.collectionGroup("workoutLogs").count().get()).data().count;
    const completedWorkouts = (await firestore.collectionGroup("workoutLogs")
        .where("completionType", "==", "full").count().get()).data().count;
    // Avg success rate (completed / total logged, default 0)
    const avgSuccessRate = totalWorkoutLogs > 0
        ? Math.round((completedWorkouts / totalWorkoutLogs) * 100)
        : 0;
    // Count active squads
    const activeSquads = (await firestore.collection("squads").count().get()).data().count;
    // Count active challenges
    const activeChallenges = (await firestore.collection("challenges").count().get()).data().count;
    // Count total programs generated via collectionGroup
    const totalPrograms = (await firestore.collectionGroup("programs").count().get()).data().count;
    await firestore.doc("platformStats/current").set({
        activeOperators,
        totalOperators,
        totalWorkoutLogs,
        avgSuccessRate,
        activeSquads,
        activeChallenges,
        totalPrograms,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
/**
 * Firestore trigger: refresh stats when any user doc changes.
 * Debounced: skips if stats were refreshed within the last 5 minutes
 * to prevent read amplification (full table scan on every write).
 */
exports.onUserChange = (0, firestore_1.onDocumentWritten)("users/{uid}", async () => {
    const firestore = admin.firestore();
    const statsRef = firestore.doc("platformStats/current");
    const statsSnap = await statsRef.get();
    if (statsSnap.exists) {
        const lastUpdate = statsSnap.data()?.updatedAt?.toMillis?.() ?? 0;
        if (Date.now() - lastUpdate < 5 * 60 * 1000)
            return; // skip if < 5min ago
    }
    await aggregateStats();
});
const ADMIN_EMAILS = ["vinc.charles0@gmail.com"];
/** Callable: manually trigger stats refresh (admin only) */
exports.triggerStatsRefresh = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    if (!ADMIN_EMAILS.includes(request.auth.token?.email || "")) {
        throw new https_1.HttpsError("permission-denied", "Admin access required.");
    }
    await aggregateStats();
    return { success: true };
});
/**
 * One-time backfill: sync avatarUrl, callsign, stats, AND calculated progress
 * from user docs to all challenge participant docs.
 */
exports.backfillParticipantProfiles = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    if (!ADMIN_EMAILS.includes(request.auth.token?.email || "")) {
        throw new https_1.HttpsError("permission-denied", "Admin access required.");
    }
    const firestore = admin.firestore();
    const challengesSnap = await firestore.collection("challenges").get();
    let updated = 0;
    for (const challengeDoc of challengesSnap.docs) {
        const challenge = challengeDoc.data();
        const targetType = challenge.targetType;
        const target = challenge.target || 80;
        const participantsSnap = await firestore
            .collection(`challenges/${challengeDoc.id}/participants`)
            .get();
        for (const participantDoc of participantsSnap.docs) {
            const uid = participantDoc.id;
            const userDoc = await firestore.doc(`users/${uid}`).get();
            if (!userDoc.exists)
                continue;
            const userData = userDoc.data();
            const avatarUrl = userData.avatarUrl ?? "";
            const callsign = userData.callsign ?? "";
            // Pull behavior state for stats + progress calculation
            const behaviorDoc = await firestore.doc(`users/${uid}/behaviorState/data`).get();
            const b = behaviorDoc.exists ? behaviorDoc.data() : {};
            const streakDays = b.streakDays ?? 0;
            const totalWorkoutsCompleted = b.totalWorkoutsCompleted ?? 0;
            const alignmentScore = b.alignmentScore ?? 50;
            // Use 14d rolling counters for consistency (matches client-side syncChallengeProgress)
            const workoutsCompleted14d = b.workoutsCompleted14d ?? b.workoutsCompletedThisWeek ?? 0;
            const workoutsSkipped14d = b.workoutsSkipped14d ?? b.workoutsSkippedThisWeek ?? 0;
            // Calculate progress based on challenge targetType
            let progress = 0;
            switch (targetType) {
                case "consistency": {
                    const total = workoutsCompleted14d + workoutsSkipped14d;
                    progress = total > 0 ? Math.round((workoutsCompleted14d / total) * 100) : 0;
                    break;
                }
                case "streak":
                    progress = Math.min(Math.round((streakDays / target) * 100), 100);
                    break;
                case "workouts":
                    progress = Math.min(Math.round((totalWorkoutsCompleted / target) * 100), 100);
                    break;
            }
            await participantDoc.ref.update({
                avatarUrl,
                callsign,
                streakDays,
                totalWorkoutsCompleted,
                alignmentScore,
                progress: Math.min(Math.round(progress), 100),
            });
            updated++;
        }
    }
    return { success: true, updated };
});
/**
 * One-time backfill: add completedAtMs (epoch) to all workoutLogs that lack it.
 * After running, queries can switch from completedAt string to completedAtMs number.
 */
exports.backfillCompletedAtMs = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    if (!ADMIN_EMAILS.includes(request.auth.token?.email || "")) {
        throw new https_1.HttpsError("permission-denied", "Admin access required.");
    }
    const firestore = admin.firestore();
    const usersSnap = await firestore.collection("users").get();
    let updated = 0;
    for (const userDoc of usersSnap.docs) {
        const logsSnap = await firestore.collection(`users/${userDoc.id}/workoutLogs`).get();
        let batch = firestore.batch();
        let batchCount = 0;
        for (const logDoc of logsSnap.docs) {
            const data = logDoc.data();
            if (data.completedAtMs)
                continue;
            const completedAt = data.completedAt;
            if (!completedAt)
                continue;
            const ms = new Date(completedAt).getTime();
            if (isNaN(ms))
                continue;
            batch.update(logDoc.ref, { completedAtMs: ms });
            batchCount++;
            if (batchCount >= 499) {
                await batch.commit();
                updated += batchCount;
                batch = firestore.batch();
                batchCount = 0;
            }
        }
        if (batchCount > 0) {
            await batch.commit();
            updated += batchCount;
        }
    }
    return { success: true, updated };
});
//# sourceMappingURL=index.js.map
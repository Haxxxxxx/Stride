import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as nacl from "tweetnacl";
import bs58 from "bs58";
import * as nodemailer from "nodemailer";

admin.initializeApp();

// SMTP secrets — set via: firebase functions:secrets:set SMTP_HOST, etc.
const smtpHost = defineSecret("SMTP_HOST");
const smtpPort = defineSecret("SMTP_PORT");
const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");
const smtpFrom = defineSecret("SMTP_FROM");

/**
 * Wallet sign-in — creates a persistent Firebase identity linked to a Solana wallet.
 * Verifies the wallet signature server-side, then either finds the existing user
 * or creates a new one. Returns a custom token for signInWithCustomToken().
 */
export const walletSignIn = onCall(async (request) => {
  const { walletAddress, signature, message } = request.data ?? {};

  if (!walletAddress || typeof walletAddress !== "string") {
    throw new HttpsError("invalid-argument", "walletAddress is required.");
  }
  if (!signature || !Array.isArray(signature)) {
    throw new HttpsError("invalid-argument", "signature is required.");
  }
  if (!message || typeof message !== "string") {
    throw new HttpsError("invalid-argument", "message is required.");
  }

  // Decode the wallet public key from base58
  let pubkeyBytes: Uint8Array;
  try {
    pubkeyBytes = bs58.decode(walletAddress);
  } catch {
    throw new HttpsError("invalid-argument", "Invalid wallet address.");
  }

  if (pubkeyBytes.length !== 32) {
    throw new HttpsError("invalid-argument", "Invalid wallet address length.");
  }

  // Reject stale signatures — prevent replay attacks (5 minute window)
  const timestampMatch = message.match(/at (\d+)$/);
  if (!timestampMatch) {
    throw new HttpsError("invalid-argument", "Invalid message format.");
  }
  const messageTimestamp = Number(timestampMatch[1]);
  const ageMs = Date.now() - messageTimestamp;
  if (ageMs < 0 || ageMs > 5 * 60 * 1000) {
    throw new HttpsError("unauthenticated", "Signature expired.");
  }

  // Verify the signature
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = new Uint8Array(signature);
  const valid = nacl.sign.detached.verify(messageBytes, signatureBytes, pubkeyBytes);
  if (!valid) {
    throw new HttpsError("unauthenticated", "Invalid wallet signature.");
  }

  const firestore = admin.firestore();
  const walletIndexRef = firestore.doc(`walletIndex/${walletAddress}`);

  // Check if this wallet is already linked to a user
  const walletDoc = await walletIndexRef.get();
  let uid: string;

  if (walletDoc.exists) {
    uid = walletDoc.data()!.uid;
  } else {
    // Create a new Firebase user for this wallet
    const newUser = await admin.auth().createUser({
      displayName: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
    });
    uid = newUser.uid;

    // Write the wallet index (admin-only collection)
    await walletIndexRef.set({
      uid,
      walletAddress,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create default user doc
    await firestore.doc(`users/${uid}`).set({
      walletAddress,
      betaValidated: false,
      onboardingComplete: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
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
export const validateBetaCode = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const code = request.data?.code;
  if (!code || typeof code !== "string" || code.length !== 6) {
    throw new HttpsError("invalid-argument", "A 6-character beta code is required.");
  }

  const firestore = admin.firestore();
  const codeRef = firestore.doc(`betaCodes/${code.toUpperCase()}`);
  const userRef = firestore.doc(`users/${uid}`);

  await firestore.runTransaction(async (tx) => {
    const codeSnap = await tx.get(codeRef);
    if (!codeSnap.exists || codeSnap.data()?.used) {
      throw new HttpsError("not-found", "Invalid or expired beta code");
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
export const sendSignInEmail = onCall(
  { secrets: [smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom] },
  async (request) => {
    const email = request.data?.email;
    if (!email || typeof email !== "string" || !/^.+@.+\..+$/.test(email)) {
      throw new HttpsError("invalid-argument", "A valid email is required.");
    }

    const continueUrl = request.data?.continueUrl;
    if (!continueUrl || typeof continueUrl !== "string") {
      throw new HttpsError("invalid-argument", "continueUrl is required.");
    }

    // Rate limit: 1 email per 60s per address
    const firestore = admin.firestore();
    const rateLimitRef = firestore.doc(`_rateLimit/email_${email.toLowerCase()}`);
    const rateLimitSnap = await rateLimitRef.get();
    if (rateLimitSnap.exists) {
      const lastSent = rateLimitSnap.data()?.timestamp?.toMillis?.() ?? 0;
      if (Date.now() - lastSent < 60_000) {
        throw new HttpsError("resource-exhausted", "Please wait before requesting another email.");
      }
    }

    // Generate the sign-in link via Admin SDK
    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
    };

    let signInLink: string;
    try {
      signInLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
    } catch (err: unknown) {
      console.error("generateSignInWithEmailLink failed:", err);
      throw new HttpsError("internal", "Failed to generate sign-in link.");
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
    } catch (err: unknown) {
      console.error("sendMail failed:", err);
      throw new HttpsError("internal", "Failed to send email.");
    }

    // Update rate limit
    await rateLimitRef.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() });

    return { success: true };
  }
);

// ============================================================
// Platform Stats Aggregation
// ============================================================

/**
 * Aggregate real platform stats from Firestore collections.
 * Writes to platformStats/current — publicly readable for the landing page.
 */
async function aggregateStats(): Promise<void> {
  const firestore = admin.firestore();

  // Count active operators (users with onboardingComplete)
  const usersSnap = await firestore.collection("users").get();
  const activeOperators = usersSnap.docs.filter(
    (d) => d.data().onboardingComplete === true
  ).length;
  const totalOperators = usersSnap.size;

  // Count total workout logs across all users
  let totalWorkoutLogs = 0;
  let completedWorkouts = 0;
  for (const userDoc of usersSnap.docs) {
    const logsSnap = await firestore
      .collection(`users/${userDoc.id}/workoutLogs`)
      .get();
    totalWorkoutLogs += logsSnap.size;
    completedWorkouts += logsSnap.docs.filter(
      (d) => d.data().completionType === "completed"
    ).length;
  }

  // Avg success rate (completed / total logged, default 0)
  const avgSuccessRate =
    totalWorkoutLogs > 0
      ? Math.round((completedWorkouts / totalWorkoutLogs) * 100)
      : 0;

  // Count active squads
  const squadsSnap = await firestore.collection("squads").get();
  const activeSquads = squadsSnap.size;

  // Count active challenges
  const challengesSnap = await firestore.collection("challenges").get();
  const activeChallenges = challengesSnap.size;

  // Count total programs generated
  let totalPrograms = 0;
  for (const userDoc of usersSnap.docs) {
    const programsSnap = await firestore
      .collection(`users/${userDoc.id}/programs`)
      .get();
    totalPrograms += programsSnap.size;
  }

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

/** Firestore trigger: refresh stats when any user doc changes */
export const onUserChange = onDocumentWritten("users/{uid}", async () => {
  await aggregateStats();
});

/** Callable: manually trigger stats refresh */
export const triggerStatsRefresh = onCall(async () => {
  await aggregateStats();
  return { success: true };
});


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
exports.validateBetaCode = exports.walletSignIn = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const nacl = __importStar(require("tweetnacl"));
const bs58_1 = __importDefault(require("bs58"));
admin.initializeApp();
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
//# sourceMappingURL=index.js.map
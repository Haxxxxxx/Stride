import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as nacl from "tweetnacl";
import bs58 from "bs58";

admin.initializeApp();

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


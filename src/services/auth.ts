import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithPopup,
  signInWithRedirect,
  signInWithCustomToken,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase";

const googleProvider = new GoogleAuthProvider();

// Passwordless email link auth via Firebase built-in sender
export async function sendEmailSignInLink(email: string) {
  const continueUrl = `${window.location.origin}/onboarding/verify`;
  await sendSignInLinkToEmail(auth, email, {
    url: continueUrl,
    handleCodeInApp: true,
  });
  window.localStorage.setItem("emailForSignIn", email);
}

export function isEmailSignInLink(url: string): boolean {
  return isSignInWithEmailLink(auth, url);
}

export async function completeEmailSignIn(email: string, url: string) {
  return signInWithEmailLink(auth, email, url);
}

// Google Auth — popup with redirect fallback for mobile
export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: unknown) {
    const firebaseErr = err as { code?: string };
    // Popup blocked (mobile browsers) or cancelled — fall back to redirect
    if (
      firebaseErr.code === "auth/popup-blocked" ||
      firebaseErr.code === "auth/popup-closed-by-user" ||
      firebaseErr.code === "auth/cancelled-popup-request"
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

// Check for redirect result on page load (for Google redirect flow)
export async function checkRedirectResult() {
  return getRedirectResult(auth);
}

/**
 * Wallet auth — persistent identity linked to Solana wallet address.
 * 1. Signs a message with the wallet to prove ownership
 * 2. Calls walletSignIn Cloud Function which verifies signature + returns custom token
 * 3. Signs in with the custom token for a stable Firebase uid
 */
export async function signInWithWallet(
  publicKey: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
) {
  const message = `Sign in to STRIDE with wallet ${publicKey} at ${Date.now()}`;
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = await signMessage(messageBytes);

  const walletSignInFn = httpsCallable<
    { walletAddress: string; signature: number[]; message: string },
    { token: string }
  >(functions, "walletSignIn");

  const result = await walletSignInFn({
    walletAddress: publicKey,
    signature: Array.from(signatureBytes),
    message,
  });

  return signInWithCustomToken(auth, result.data.token);
}

export async function logOut() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

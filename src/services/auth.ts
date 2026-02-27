import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  signInWithCustomToken,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Passwordless email link auth
export async function sendEmailSignInLink(email: string) {
  const actionCodeSettings = {
    url: window.location.origin + "/onboarding/verify",
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
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

// Wallet auth — sign in anonymously then link wallet address to profile
export async function signInWithWallet(publicKey: string) {
  // Use anonymous auth as the Firebase identity, store wallet pubkey on profile
  const result = await signInAnonymously(auth);
  return { user: result.user, walletAddress: publicKey };
}

export async function signInAsGuest() {
  return signInAnonymously(auth);
}

export async function logOut() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

import image_649dc395704951058b9543ab59c196ca800a5539 from 'figma:asset/649dc395704951058b9543ab59c196ca800a5539.webp'
import image_ed2679aab5c84af8a717c4d8b5f3c6d516a31e51 from 'figma:asset/ed2679aab5c84af8a717c4d8b5f3c6d516a31e51.webp'
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import imgRectangle7 from "figma:asset/d2dc082de376809efe9160821f9df7f46005e136.webp";
import { useOnboardingStore } from "../../../stores/onboardingStore";
import { useAuth } from "../../contexts/AuthContext";
import { sendEmailSignInLink, signInWithGoogle, signInWithWallet } from "../../../services/auth";
import { routeAfterAuth } from "../../utils/routeAfterAuth";

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { email, setEmail } = useOnboardingStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Track if wallet connect was explicitly initiated by the user this session
  const walletInitiated = useRef(false);

  const handleContinue = async () => {
    if (!email) return;
    if (!/.+@.+\..+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await sendEmailSignInLink(email);
      navigate("/onboarding/verify");
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError(firebaseErr.message || "Failed to send verification link");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      // result is null when redirect flow is used (mobile)
      if (result) {
        setEmail(result.user.email || "");
        await routeAfterAuth(result.user.uid, navigate);
      }
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      setError(firebaseErr.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const wallet = useWallet();
  const walletModal = useWalletModal();
  // Track the wallet name selected during THIS connect flow (ignore cached selections)
  const selectedWalletName = useRef<string | null>(null);
  // Track which pubkey we've already started auth for — prevents double-fire
  const authedPubkey = useRef<string | null>(null);

  // When user selects a wallet from the modal, close the modal and trigger connect()
  useEffect(() => {
    if (!walletInitiated.current) return;
    // Only connect if this wallet was selected AFTER the modal was opened
    if (wallet.wallet && wallet.wallet.adapter.name !== selectedWalletName.current) {
      selectedWalletName.current = wallet.wallet.adapter.name;
      if (!wallet.connected && !wallet.connecting) {
        if (walletModal.visible) walletModal.setVisible(false);
        wallet.connect().catch((err: unknown) => {
          const e = err as { message?: string };
          setError(e.message || "Wallet connection failed");
          setLoading(false);
        });
      }
    }
    // If modal was opened but no wallet was selected (user dismissed), reset loading
    if (!wallet.wallet && !walletModal.visible && loading && walletInitiated.current) {
      setLoading(false);
    }
  }, [wallet.wallet, wallet.connected, wallet.connecting, walletModal.visible]);

  // After wallet connects and publicKey is available, authenticate with Firebase via signature
  useEffect(() => {
    if (!walletInitiated.current) return;
    if (!wallet.publicKey || !wallet.signMessage) return;
    if (user) return;

    const pubkey = wallet.publicKey.toBase58();
    // Skip if we already started auth for this exact pubkey
    if (authedPubkey.current === pubkey) return;
    authedPubkey.current = pubkey;

    setLoading(true);
    signInWithWallet(pubkey, wallet.signMessage)
      .then((cred) => {
        return routeAfterAuth(cred.user.uid, navigate);
      })
      .catch((err: unknown) => {
        const e = err as { message?: string };
        setError(e.message || "Wallet authentication failed");
        // Clear so user can retry with same or different wallet
        authedPubkey.current = null;
      })
      .finally(() => setLoading(false));
  }, [wallet.publicKey, user]);

  const handleWalletConnect = async () => {
    setError("");
    setLoading(true);
    walletInitiated.current = true;
    selectedWalletName.current = null;
    authedPubkey.current = null;
    // Disconnect any cached wallet so the modal shows a fresh selection
    if (wallet.connected) {
      await wallet.disconnect();
    }
    if (wallet.wallet) {
      wallet.select(null);
    }
    walletModal.setVisible(true);
  };

  return (
    <div className="relative size-full bg-black flex items-center justify-center overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
        backgroundSize: '100% 4px'
      }} />

      <div className="relative z-10 w-full max-w-[375px] p-6 flex flex-col items-center justify-center gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="h-[24px] w-[35px] overflow-hidden relative">
            <img
              src={image_649dc395704951058b9543ab59c196ca800a5539}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold uppercase tracking-wider text-center">
            System Access
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-6 w-full">
          {/* Email Input */}
          <div className="flex flex-col gap-3">
            <label className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@system.net"
              className="w-full bg-black border border-white/20 px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-white placeholder:text-white/30 focus:border-[#ff6600] focus:outline-none"
            />
            {error && (
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-red-500">
                {error}
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!email || loading}
            className="w-full bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[11px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-2 border-[#ff6600]"
          >
            {loading ? "Connecting..." : "Continue →"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px bg-white/20" />
            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-[2px]">
              Or Continue With
            </div>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border border-white/20 py-3 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:border-[#ff6600] hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          {/* Wallet Connect Button */}
          <button
            onClick={handleWalletConnect}
            disabled={loading}
            className="w-full border border-white/20 py-3 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:border-[#ff6600] hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <svg className="size-4" fill="none" viewBox="0 0 18 18">
              <path
                d="M3.75 5.625H2.25C1.83579 5.625 1.5 5.96079 1.5 6.375V13.5C1.5 13.9142 1.83579 14.25 2.25 14.25H3.75M3.75 5.625V14.25M3.75 5.625H14.25M3.75 14.25H14.25M14.25 5.625H15.75C16.1642 5.625 16.5 5.96079 16.5 6.375V13.5C16.5 13.9142 16.1642 14.25 15.75 14.25H14.25M14.25 5.625V14.25M6 5.625V14.25M12 5.625V14.25M9 2.25V5.625M7.5 3.75H10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
            Connect Wallet
          </button>
        </div>

        {/* Terms */}
        <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 text-center">
          By continuing, you agree to our{" "}
          <span className="text-white/60 underline cursor-pointer">Terms of Service</span>
          {" "}and{" "}
          <span className="text-white/60 underline cursor-pointer">Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}

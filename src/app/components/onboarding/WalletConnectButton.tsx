/**
 * WalletConnectButton — lazy-loaded chunk.
 *
 * This file is the ONLY place that imports from @solana/wallet-adapter-*.
 * It is never imported statically, so the entire Solana adapter tree stays
 * out of the main bundle and is only fetched when the user clicks
 * "Connect Wallet" for the first time.
 *
 * The component owns its own ConnectionProvider + WalletProvider +
 * WalletModalProvider so it has no dependency on a global wallet context.
 */
import { useMemo, useEffect, useRef, useState } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { useAuth } from "../../contexts/AuthContext";
import { signInWithWallet } from "../../../services/auth";
import { routeAfterAuth } from "../../utils/routeAfterAuth";
import { useNavigate } from "react-router";

interface Props {
  onError: (msg: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

/** Inner component — must be rendered inside WalletModalProvider */
function WalletConnectInner({ onError, onLoadingChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const walletInitiated = useRef(false);
  const selectedWalletName = useRef<string | null>(null);
  const authedPubkey = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Propagate loading state to parent
  useEffect(() => {
    onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  // When user selects a wallet from the modal, trigger connect()
  useEffect(() => {
    if (!walletInitiated.current) return;
    if (wallet.wallet && wallet.wallet.adapter.name !== selectedWalletName.current) {
      selectedWalletName.current = wallet.wallet.adapter.name;
      if (!wallet.connected && !wallet.connecting) {
        if (walletModal.visible) walletModal.setVisible(false);
        wallet.connect().catch((err: unknown) => {
          const e = err as { message?: string };
          onError(e.message || "Wallet connection failed");
          setLoading(false);
        });
      }
    }
    // Modal dismissed without selecting a wallet
    if (!wallet.wallet && !walletModal.visible && loading && walletInitiated.current) {
      setLoading(false);
    }
  }, [wallet.wallet, wallet.connected, wallet.connecting, walletModal.visible]);

  // After wallet connects, authenticate with Firebase via signature
  useEffect(() => {
    if (!walletInitiated.current) return;
    if (!wallet.publicKey || !wallet.signMessage) return;
    if (user) return;

    const pubkey = wallet.publicKey.toBase58();
    if (authedPubkey.current === pubkey) return;
    authedPubkey.current = pubkey;

    setLoading(true);
    signInWithWallet(pubkey, wallet.signMessage)
      .then((cred) => routeAfterAuth(cred.user.uid, navigate))
      .catch((err: unknown) => {
        const e = err as { message?: string };
        onError(e.message || "Wallet authentication failed");
        authedPubkey.current = null;
      })
      .finally(() => setLoading(false));
  }, [wallet.publicKey, user]);

  const handleClick = async () => {
    onError("");
    setLoading(true);
    walletInitiated.current = true;
    selectedWalletName.current = null;
    authedPubkey.current = null;
    if (wallet.connected) await wallet.disconnect();
    if (wallet.wallet) wallet.select(null);
    walletModal.setVisible(true);
  };

  return (
    <button
      onClick={handleClick}
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
      {loading ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}

/** Exported default — wraps inner component with its own provider chain */
export default function WalletConnectButton(props: Props) {
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletConnectInner {...props} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

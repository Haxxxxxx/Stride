import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { SolanaWalletProvider } from "./contexts/WalletContext";

export default function App() {
  return (
    <SolanaWalletProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </SolanaWalletProvider>
  );
}

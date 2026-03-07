import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { SolanaWalletProvider } from "./contexts/WalletContext";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <SolanaWalletProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </SolanaWalletProvider>
    </ErrorBoundary>
  );
}

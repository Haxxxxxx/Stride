import { Navigate, Outlet } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-black w-full min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-3 bg-[#ff6600] animate-pulse" />
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px]">
            Initializing System...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding/welcome" replace />;
  }

  return <Outlet />;
}

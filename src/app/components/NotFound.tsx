import { useNavigate } from "react-router";
import { Scanline } from "./Scanline";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white font-['JetBrains_Mono',monospace] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <Scanline opacity="0.03" />

      {/* Glitch-style 404 */}
      <div className="relative mb-6">
        <h1
          className="text-[120px] sm:text-[160px] font-bold leading-none tracking-tighter"
          style={{ color: "#ff6600" }}
        >
          404
        </h1>
        {/* Shadow layers for depth */}
        <h1
          className="absolute inset-0 text-[120px] sm:text-[160px] font-bold leading-none tracking-tighter opacity-20 translate-x-1 translate-y-1"
          style={{ color: "#ff6600" }}
          aria-hidden
        >
          404
        </h1>
      </div>

      {/* Terminal-style message */}
      <div className="text-center space-y-3 max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          // SECTOR NOT FOUND
        </p>
        <p className="text-sm text-white/70">
          Target coordinates invalid. This sector doesn't exist or has been decommissioned.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-10">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 text-xs uppercase tracking-[0.2em] font-bold transition-colors cursor-pointer"
          style={{ backgroundColor: "#ff6600", color: "black" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#cc5200";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ff6600";
          }}
        >
          Return to Base
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 text-xs uppercase tracking-[0.2em] border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>

      {/* Status line */}
      <p className="absolute bottom-6 text-[10px] text-white/20 uppercase tracking-[0.2em]">
        STRIDE OS — ROUTE ERROR
      </p>
    </div>
  );
}

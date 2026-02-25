// STRIDE System Message Component
// Displays micro-language messages with industrial aesthetic
// Used across Dashboard, Workout Modal, and other surfaces

import { useState, useEffect } from "react";

interface SystemMessageProps {
  message: string;
  variant?: "default" | "identity" | "friction" | "neuroplastic" | "streak" | "warning";
  onDismiss?: () => void;
  autoDismiss?: number; // ms
  showDismiss?: boolean;
}

export function SystemMessage({
  message,
  variant = "default",
  onDismiss,
  autoDismiss,
  showDismiss = true,
}: SystemMessageProps) {
  const [visible, setVisible] = useState(true);
  const [appearing, setAppearing] = useState(true);

  useEffect(() => {
    // Entrance animation
    const enterTimeout = setTimeout(() => setAppearing(false), 300);

    if (autoDismiss && autoDismiss > 0) {
      const dismissTimeout = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismiss);
      return () => {
        clearTimeout(enterTimeout);
        clearTimeout(dismissTimeout);
      };
    }

    return () => clearTimeout(enterTimeout);
  }, [autoDismiss, onDismiss]);

  if (!visible || !message) return null;

  const borderColor = {
    default: "border-white/30",
    identity: "border-white/40",
    friction: "border-[#ff6600]",
    neuroplastic: "border-[#ff6600]",
    streak: "border-[#ff6600]",
    warning: "border-white/50",
  }[variant];

  const bgColor = {
    default: "bg-black",
    identity: "bg-white/5",
    friction: "bg-[#ff6600]/5",
    neuroplastic: "bg-[#ff6600]/10",
    streak: "bg-[#ff6600]/5",
    warning: "bg-white/5",
  }[variant];

  const textColor = {
    default: "text-white/80",
    identity: "text-white",
    friction: "text-[#ff6600]",
    neuroplastic: "text-white",
    streak: "text-[#ff6600]",
    warning: "text-white/70",
  }[variant];

  const labelText = {
    default: "SYS",
    identity: "IDENTITY",
    friction: "FRICTION",
    neuroplastic: "ENCODE",
    streak: "MILESTONE",
    warning: "ALERT",
  }[variant];

  const labelColor = {
    default: "text-white/40",
    identity: "text-white/50",
    friction: "text-[#ff6600]",
    neuroplastic: "text-[#ff6600]",
    streak: "text-[#ff6600]",
    warning: "text-white/50",
  }[variant];

  const indicatorColor = {
    default: "bg-white/40",
    identity: "bg-white",
    friction: "bg-[#ff6600]",
    neuroplastic: "bg-[#ff6600]",
    streak: "bg-[#ff6600]",
    warning: "bg-white/60",
  }[variant];

  return (
    <div
      className={`border ${borderColor} ${bgColor} p-3 relative transition-all duration-300 ${
        appearing ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
      }`}
    >
      {/* Left accent line for friction/neuroplastic */}
      {(variant === "friction" || variant === "neuroplastic") && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ff6600]" />
      )}

      <div className="flex items-start gap-2">
        <div className={`size-[5px] ${indicatorColor} mt-[5px] shrink-0`} />
        <div className="flex-1 min-w-0">
          <div
            className={`font-['JetBrains_Mono',monospace] text-[7px] ${labelColor} uppercase tracking-[2px] mb-1`}
          >
            {labelText}
          </div>
          <div
            className={`font-['JetBrains_Mono',monospace] text-[10px] ${textColor} leading-[1.5] whitespace-pre-line`}
          >
            {message}
          </div>
        </div>

        {showDismiss && onDismiss && (
          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="shrink-0 size-4 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
          >
            <svg
              className="size-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
            >
              <path
                strokeLinecap="square"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Scanline */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
          backgroundSize: "100% 4px",
        }}
      />
    </div>
  );
}

export function Scanline({ opacity = "0.03" }: { opacity?: string }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: parseFloat(opacity),
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
        backgroundSize: "100% 4px",
      }}
    />
  );
}

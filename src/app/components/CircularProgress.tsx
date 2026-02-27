interface CircularProgressProps {
  progress: number; // 0-100
  isComplete?: boolean;
  isActive?: boolean;
}

const SIZE = 18;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularProgress({ progress, isComplete = false, isActive = false }: CircularProgressProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  const color = isComplete || isActive ? "#ff6600" : "white";
  const trackOpacity = isComplete ? 0.15 : isActive ? 0.15 : 0.1;

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block -rotate-90">
        {/* Background track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          opacity={trackOpacity}
        />
        {/* Progress arc */}
        {clamped > 0 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="square"
          />
        )}
      </svg>
      {/* Checkmark for completed */}
      {isComplete && (
        <svg
          className="absolute inset-0"
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          fill="none"
        >
          <path
            d="M5.5 9.5L7.5 11.5L12.5 6"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      )}
    </div>
  );
}

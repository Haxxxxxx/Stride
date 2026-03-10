import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../services/firebase";

interface PlatformStats {
  activeOperators: number;
  totalWorkoutLogs: number;
  avgSuccessRate: number;
  activeSquads: number;
}

const FALLBACK: PlatformStats = {
  activeOperators: 0,
  totalWorkoutLogs: 0,
  avgSuccessRate: 0,
  activeSquads: 0,
};

function formatStat(value: number): { target: number; suffix: string } {
  if (value >= 1_000_000) return { target: parseFloat((value / 1_000_000).toFixed(1)), suffix: "M" };
  if (value >= 1_000) return { target: parseFloat((value / 1_000).toFixed(1)), suffix: "K" };
  return { target: value, suffix: "" };
}

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(target * eased);
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  const displayValue = target % 1 !== 0
    ? count.toFixed(1)
    : Math.floor(count).toLocaleString();

  return (
    <div ref={ref}>
      <span className="font-['JetBrains_Mono'] text-[36px] md:text-[48px] text-[#f60]">
        {displayValue}
      </span>
      {suffix && (
        <span className="font-['JetBrains_Mono'] text-[24px] md:text-[32px] text-[#f60]">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Stats() {
  const [data, setData] = useState<PlatformStats>(FALLBACK);

  useEffect(() => {
    getDoc(doc(db, "platformStats/current"))
      .then((snap) => {
        if (snap.exists()) {
          setData(snap.data() as PlatformStats);
        }
      })
      .catch(console.warn);
  }, []);

  const operators = formatStat(data.activeOperators);
  const workouts = formatStat(data.totalWorkoutLogs);
  const successRate = { target: data.avgSuccessRate, suffix: "%" };
  const squads = formatStat(data.activeSquads);

  const stats = [
    { ...operators, label: "Active Operators" },
    { ...workouts, label: "Operations Logged" },
    { ...successRate, label: "Avg Success Rate" },
    { ...squads, label: "Active Squads" },
  ];

  return (
    <section id="stats" className="bg-black py-24 md:py-32 relative">
      <div className="absolute top-0 left-6 right-6 h-px bg-white/10" />

      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f60]/[0.02] via-transparent to-transparent" />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="font-['JetBrains_Mono'] text-[9px] tracking-[3px] uppercase text-[#f60] block mb-3">
            Operational Data
          </span>
          <h2 className="font-['JetBrains_Mono'] text-[24px] md:text-[32px] tracking-[1px] uppercase text-white">
            System Metrics
          </h2>
          <div className="w-12 h-[2px] bg-[#f60] mt-4 mx-auto" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-black p-8 text-center"
            >
              <AnimatedNumber target={stat.target} suffix={stat.suffix} />
              <p className="font-['JetBrains_Mono'] text-[9px] tracking-[2px] uppercase text-white/40 mt-3">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

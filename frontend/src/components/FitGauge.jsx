const SIZE = 78;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function tone(score) {
  if (score >= 7.5) return "var(--color-teal)";
  if (score >= 5) return "var(--color-amber)";
  return "var(--color-red)";
}

export default function FitGauge({ score = 0, size = SIZE }) {
  const clamped = Math.max(0, Math.min(10, score));
  const scale = size / SIZE;
  const radius = RADIUS * scale;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (clamped / 10) * circ;
  const color = tone(clamped);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={STROKE * scale}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={STROKE * scale}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(.16,1,.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-semibold leading-none" style={{ color, fontSize: Math.max(18, size * 0.33) }}>
          {clamped.toFixed(1)}
        </span>
        <span className="text-[9px] tracking-widest text-muted font-mono mt-0.5">/10</span>
      </div>
    </div>
  );
}

"use client";

function getScoreColor(score: number): string {
  if (score <= 3) return "#dc2626";
  if (score <= 6) return "#d97706";
  if (score <= 8) return "#059669";
  return "#7c3aed";
}

export function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const fraction = Math.max(0, Math.min(score / 10, 1));

  // Use a circle with stroke-dasharray to create a semicircle gauge.
  // The circle is rotated so the visible half is on top.
  const r = 36;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  const halfCircumference = circumference / 2;

  // Background: show only the top half (semicircle)
  // Score: fill a portion of that semicircle
  const scoreDash = halfCircumference * fraction;

  return (
    <div className="flex flex-col items-center shrink-0">
      <svg viewBox="0 0 100 60" className="w-[96px] h-auto">
        {/* Background semicircle (gray) */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${halfCircumference} ${circumference}`}
          transform={`rotate(180 ${cx} ${cy})`}
        />

        {/* Score fill (colored) */}
        {fraction > 0.01 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${scoreDash} ${circumference}`}
            transform={`rotate(180 ${cx} ${cy})`}
          />
        )}

        {/* Score number */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="auto"
          fill={color}
          fontSize="24"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {score}
        </text>

        {/* /10 label */}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="10"
          fontFamily="system-ui, sans-serif"
        >
          /10
        </text>
      </svg>
    </div>
  );
}

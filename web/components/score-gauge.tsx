"use client";

function getScoreColor(score: number): string {
  if (score <= 3) return "#dc2626";
  if (score <= 6) return "#d97706";
  if (score <= 8) return "#059669";
  return "#7c3aed";
}

/**
 * Attempt to describe a point on a semicircular arc.
 * The arc spans from 180 degrees (left) to 0 degrees (right),
 * sweeping clockwise over the top. In SVG, Y-axis points down,
 * so we use: x = cx + r*cos(angle), y = cy - r*sin(angle)
 * where angle is measured counter-clockwise from the positive X-axis.
 *
 * We parameterize with t in [0, 1] where t=0 is leftmost (180 deg)
 * and t=1 is rightmost (0 deg).
 */
function arcPoint(cx: number, cy: number, r: number, t: number) {
  const angle = Math.PI * (1 - t); // t=0 → π (left), t=1 → 0 (right)
  return {
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  };
}

export function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const fraction = Math.max(0, Math.min(score / 10, 1));

  const cx = 60;
  const cy = 55;
  const r = 38;

  // Background arc: full semicircle from left (t=0) to right (t=1)
  const bgStart = arcPoint(cx, cy, r, 0);
  const bgEnd = arcPoint(cx, cy, r, 1);

  // Score arc: from left (t=0) to fraction
  const scoreEnd = arcPoint(cx, cy, r, fraction);
  const largeArc = fraction > 0.5 ? 1 : 0;

  return (
    <div className="flex flex-col items-center shrink-0">
      <svg viewBox="0 0 120 72" className="w-[100px] h-auto">
        {/* Background arc — full semicircle */}
        <path
          d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Score arc */}
        {fraction > 0.01 && (
          <path
            d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${largeArc} 1 ${scoreEnd.x} ${scoreEnd.y}`}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
          />
        )}

        {/* Score number */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="26"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {score}
        </text>

        {/* /10 label */}
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="11"
          fontFamily="system-ui, sans-serif"
        >
          /10
        </text>
      </svg>
    </div>
  );
}

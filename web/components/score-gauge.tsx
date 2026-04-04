"use client";

function getScoreColor(score: number): string {
  if (score <= 3) return "#ff3864";
  if (score <= 6) return "#ff6b35";
  if (score <= 8) return "#36c5f0";
  return "#6b5bff";
}

export function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const percentage = score / 10;
  const radius = 40;
  const cx = 60;
  const cy = 50;

  // Arc from 180deg (left) to 0deg (right)
  const startAngle = Math.PI;
  const endAngle = Math.PI - percentage * Math.PI;

  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy - radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy - radius * Math.sin(endAngle);

  const largeArc = percentage > 0.5 ? 1 : 0;

  const bgStartX = cx + radius * Math.cos(Math.PI);
  const bgStartY = cy - radius * Math.sin(Math.PI);
  const bgEndX = cx + radius * Math.cos(0);
  const bgEndY = cy - radius * Math.sin(0);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 65" className="w-24 h-auto">
        {/* Background arc */}
        <path
          d={`M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 1 1 ${bgEndX} ${bgEndY}`}
          fill="none"
          stroke="#1a1a3e"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Score arc */}
        {percentage > 0 && (
          <path
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="text-2xl font-bold"
          fill={color}
          fontSize="24"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="#8888aa"
          fontSize="10"
        >
          /10
        </text>
      </svg>
    </div>
  );
}

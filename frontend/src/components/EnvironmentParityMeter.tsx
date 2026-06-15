import { useEffect, useRef, useState } from 'react';

interface EnvironmentParityMeterProps {
  score: number;
  status: string;
}

export const EnvironmentParityMeter = ({
  score,
  status,
}: EnvironmentParityMeterProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setAnimatedScore(Math.round(score * progress));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [score]);

  const getStatusColor = () => {
    switch (status) {
      case 'Healthy':
        return { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' };
      case 'Warning':
        return { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' };
      case 'Critical':
        return { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' };
      default:
        return { fill: '#6ee7b7', glow: 'rgba(110, 231, 183, 0.5)' };
    }
  };

  const statusColor = getStatusColor();
  const arcRadius = 42;
  const circumference = 2 * Math.PI * arcRadius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Needle geometry: leave an inner clear radius so text stays readable
  const innerRadius = 24; // distance from center to needle start
  const outerRadius = 50; // distance from center to needle tip

  const getNeedleRotation = () => {
    return (animatedScore / 100) * 180 - 90;
  };

  return (
    <div className="backdrop-blur-xl bg-[rgba(11,14,20,0.55)] border border-[rgba(255,255,255,0.04)] rounded-lg p-6 flex flex-col items-center gap-6">
      {/* Constrained meter card */}
      <div className="w-full flex justify-center">
        <div className="relative w-full max-w-[300px] h-64">
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 w-full h-full z-0"
            style={{ filter: 'drop-shadow(0 0 10px rgba(0, 243, 255, 0.18))', zIndex: 0 }}
          >
            {/* Outer subtle circle */}
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke="rgba(0, 243, 255, 0.08)"
              strokeWidth="1.5"
            />

            {/* Background arc (thinner) - slightly smaller radius to keep center clear */}
            <path
              d="M 58 100 A 42 42 0 0 1 142 100"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Animated progress arc (thinner glow) */}
            <path
              d="M 58 100 A 42 42 0 0 1 142 100"
              fill="none"
              stroke="#00f3ff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 0.6s ease-out',
                filter: 'drop-shadow(0 0 10px rgba(0, 243, 255, 0.35))',
              }}
            />

            {/* Status arc (colored, subtle) */}
            <path
              d="M 58 100 A 42 42 0 0 1 142 100"
              fill="none"
              stroke={statusColor.fill}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                opacity: 0.45,
                transition: 'stroke-dashoffset 0.6s ease-out',
                filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.12))',
              }}
            />

            {/* Center circle (small, decorative) */}
            <circle
              cx="100"
              cy="100"
              r="12"
              fill="rgba(0, 243, 255, 0.12)"
              stroke="#00f3ff"
              strokeWidth="1.5"
              style={{ filter: 'drop-shadow(0 0 6px rgba(0, 243, 255, 0.2))' }}
            />

            {/* Needle - draw as a floating tick between innerRadius and outerRadius */}
            <g
              style={{
                transform: `rotate(${getNeedleRotation()}deg)`,
                transformOrigin: '100px 100px',
                transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <line
                x1="100"
                y1={String(100 - /* innerRadius */ 24)}
                x2="100"
                y2={String(100 - /* outerRadius */ 50)}
                stroke="#00f3ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 243, 255, 0.5))' }}
              />
            </g>

            {/* Degree markers (adjusted to smaller radius) */}
            {[0, 45, 90, 135, 180].map((degree) => {
              const rad = (degree * Math.PI) / 180;
              const x1 = 100 + 42 * Math.cos(rad - Math.PI / 2);
              const y1 = 100 + 42 * Math.sin(rad - Math.PI / 2);
              const x2 = 100 + 50 * Math.cos(rad - Math.PI / 2);
              const y2 = 100 + 50 * Math.sin(rad - Math.PI / 2);
              return (
                <line
                  key={degree}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(0, 243, 255, 0.28)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* Center backdrop circle to mask needle inner section (optional fallback) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-14 h-14 rounded-full bg-[#0b0e14] border border-[rgba(255,255,255,0.02)]"></div>
          </div>

          {/* Center text display - ensure above SVG with z-index */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="text-center">
              <div className="text-4xl font-bold leading-none text-[#00f3ff]" style={{
                textShadow: '0 0 10px rgba(0, 243, 255, 0.7)',
              }}>
                {animatedScore}
              </div>
              <div className="text-xs uppercase tracking-widest text-cyan-200/60 mt-2">
                PARITY %
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status label and description */}
      <div className="text-center">
        <p className="text-sm font-semibold text-cyan-200">
          Status: <span style={{ color: statusColor.fill }}>{status}</span>
        </p>
        <p className="text-xs text-cyan-200/50 mt-1">
          {animatedScore >= 95
            ? 'Excellent environment parity'
            : animatedScore >= 80
              ? 'Good environment parity'
              : animatedScore >= 60
                ? 'Fair environment parity'
                : 'Poor environment parity'}
        </p>
      </div>
    </div>
  );
};

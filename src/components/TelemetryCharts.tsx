import React, { useState } from 'react';
import { TrajectoryPoint, SimulationMetrics, SimulationParams } from '../types/physics';
import { LineChart, Zap, Activity, Waves, Clock, Eye } from 'lucide-react';
import { sampleTrajectoryAtTime } from '../physics/engine';

interface TelemetryChartsProps {
  points: TrajectoryPoint[];
  metrics: SimulationMetrics;
  params: SimulationParams;
  currentTime: number;
  onScrubTime: (t: number) => void;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  points,
  metrics,
  params,
  currentTime,
  onScrubTime,
}) => {
  const [activeTab, setActiveTab] = useState<'velocity' | 'energy' | 'altitude'>('velocity');
  const [hoveredData, setHoveredData] = useState<TrajectoryPoint | null>(null);

  if (!points || points.length === 0) return null;

  // Chart dimensions for SVG
  const chartWidth = 600;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const maxT = Math.max(0.1, metrics.timeOfFlight);

  // Velocity Tab Scales
  const maxV = Math.max(...points.map((p) => Math.max(p.speed, Math.abs(p.vx), Math.abs(p.vy))), 10);
  const minV = Math.min(...points.map((p) => Math.min(p.vy, 0)), -5);
  const vRange = maxV - minV || 1;

  // Energy Tab Scales
  const maxE = Math.max(...points.map((p) => Math.max(p.totalE, p.ke, p.pe)), 10);

  // Altitude Tab Scales
  const maxY = Math.max(...points.map((p) => p.y), 10);

  // SVG coordinate helpers
  const getX = (t: number) => padding.left + (t / maxT) * innerW;
  const getVY = (v: number) => padding.top + innerH - ((v - minV) / vRange) * innerH;
  const getEY = (e: number) => padding.top + innerH - (e / maxE) * innerH;
  const getYY = (y: number) => padding.top + innerH - (y / maxY) * innerH;

  // Build SVG path strings
  const buildPath = (getYVal: (pt: TrajectoryPoint) => number) => {
    return points.reduce((acc, pt, i) => {
      const x = getX(pt.t);
      const y = getYVal(pt);
      return i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const svgX = relX * chartWidth;
    const t = Math.max(0, Math.min(maxT, ((svgX - padding.left) / innerW) * maxT));
    const sample = sampleTrajectoryAtTime(points, t);
    setHoveredData(sample);
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const svgX = relX * chartWidth;
    const t = Math.max(0, Math.min(maxT, ((svgX - padding.left) / innerW) * maxT));
    onScrubTime(t);
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col gap-3">
      {/* Tab Switcher & Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Real-time Kinematics & Energy Analysis
          </span>
        </div>

        <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('velocity')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
              activeTab === 'velocity'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Velocity (v) vs Time
          </button>

          <button
            onClick={() => setActiveTab('energy')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
              activeTab === 'energy'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            Energy (E) vs Time
          </button>

          <button
            onClick={() => setActiveTab('altitude')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
              activeTab === 'altitude'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Altitude (y) vs Time
          </button>
        </div>
      </div>

      {/* Graph Area */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] min-h-[200px]">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredData(null)}
          onClick={handleClick}
        >
          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke="#334155"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Time axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const tVal = ratio * maxT;
            const x = padding.left + ratio * innerW;
            return (
              <g key={ratio}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={chartHeight - padding.bottom}
                  stroke="rgba(51, 65, 85, 0.3)"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={chartHeight - padding.bottom + 16}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="Fira Code, monospace"
                  textAnchor="middle"
                >
                  {tVal.toFixed(1)}s
                </text>
              </g>
            );
          })}

          {/* TAB 1: Velocity Kinematics */}
          {activeTab === 'velocity' && (
            <>
              {/* Zero-line for Vy crossing */}
              <line
                x1={padding.left}
                y1={getVY(0)}
                x2={chartWidth - padding.right}
                y2={getVY(0)}
                stroke="rgba(148, 163, 184, 0.4)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={getVY(0) + 3}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="Fira Code, monospace"
                textAnchor="end"
              >
                0 m/s
              </text>
              <text
                x={padding.left - 8}
                y={getVY(maxV) + 8}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="Fira Code, monospace"
                textAnchor="end"
              >
                +{maxV.toFixed(0)}
              </text>
              <text
                x={padding.left - 8}
                y={getVY(minV) - 2}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="Fira Code, monospace"
                textAnchor="end"
              >
                {minV.toFixed(0)}
              </text>

              {/* Total speed |v| */}
              <path
                d={buildPath((p) => getVY(p.speed))}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />
              {/* Horizontal vx */}
              <path
                d={buildPath((p) => getVY(p.vx))}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
              {/* Vertical vy */}
              <path
                d={buildPath((p) => getVY(p.vy))}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
              />
            </>
          )}

          {/* TAB 2: Mechanical Energy */}
          {activeTab === 'energy' && (
            <>
              <text
                x={padding.left - 8}
                y={getEY(maxE) + 8}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="Fira Code, monospace"
                textAnchor="end"
              >
                {maxE.toFixed(0)} J
              </text>
              <text
                x={padding.left - 8}
                y={chartHeight - padding.bottom}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="Fira Code, monospace"
                textAnchor="end"
              >
                0 J
              </text>

              {/* Total Energy */}
              <path
                d={buildPath((p) => getEY(p.totalE))}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
              />
              {/* Kinetic Energy */}
              <path
                d={buildPath((p) => getEY(p.ke))}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              {/* Potential Energy */}
              <path
                d={buildPath((p) => getEY(p.pe))}
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
              />
            </>
          )}

          {/* TAB 3: Altitude vs Time */}
          {activeTab === 'altitude' && (
            <>
              <text
                x={padding.left - 8}
                y={getYY(maxY) + 8}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="Fira Code, monospace"
                textAnchor="end"
              >
                {maxY.toFixed(1)} m
              </text>
              <text
                x={padding.left - 8}
                y={chartHeight - padding.bottom}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="Fira Code, monospace"
                textAnchor="end"
              >
                0 m
              </text>

              {/* Parabolic altitude */}
              <path
                d={buildPath((p) => getYY(p.y))}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
              />
            </>
          )}

          {/* Current Scrubber Time Vertical Indicator */}
          <line
            x1={getX(currentTime)}
            y1={padding.top}
            x2={getX(currentTime)}
            y2={chartHeight - padding.bottom}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <circle
            cx={getX(currentTime)}
            cy={
              activeTab === 'velocity'
                ? getVY(sampleTrajectoryAtTime(points, currentTime).speed)
                : activeTab === 'energy'
                ? getEY(sampleTrajectoryAtTime(points, currentTime).totalE)
                : getYY(sampleTrajectoryAtTime(points, currentTime).y)
            }
            r="4"
            fill="#ffffff"
          />
        </svg>

        {/* Hover / Current Value Overlay Box */}
        {(() => {
          const pt = hoveredData || sampleTrajectoryAtTime(points, currentTime);
          return (
            <div className="absolute top-2 right-4 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] font-mono shadow-lg">
              <span className="text-slate-400">t = {pt.t.toFixed(2)}s</span>
              {activeTab === 'velocity' && (
                <>
                  <span className="text-cyan-400 font-semibold">|v|={pt.speed.toFixed(1)} m/s</span>
                  <span className="text-emerald-400 font-semibold">vx={pt.vx.toFixed(1)} m/s</span>
                  <span className="text-amber-400 font-semibold">vy={pt.vy.toFixed(1)} m/s</span>
                </>
              )}
              {activeTab === 'energy' && (
                <>
                  <span className="text-purple-400 font-semibold">Total={pt.totalE.toFixed(1)} J</span>
                  <span className="text-cyan-400">Ek={pt.ke.toFixed(1)} J</span>
                  <span className="text-emerald-400">Ep={pt.pe.toFixed(1)} J</span>
                </>
              )}
              {activeTab === 'altitude' && (
                <span className="text-amber-400 font-semibold">Altitude y = {pt.y.toFixed(2)} m</span>
              )}
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-1 px-1 border-t border-slate-800/80 text-slate-400">
        {activeTab === 'velocity' && (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block rounded" /> Speed |v| (Total)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded border-dashed" /> Horizontal (vx)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block rounded" /> Vertical (vy)
            </span>
          </div>
        )}

        {activeTab === 'energy' && (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-purple-400 inline-block rounded" /> Total Mechanical (E)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block rounded" /> Kinetic (Ek = ½mv²)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" /> Potential (Ep = mgy)
            </span>
          </div>
        )}

        {activeTab === 'altitude' && (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block rounded" /> Height y(t) Parabola
            </span>
          </div>
        )}

        <div className="text-[11px] text-slate-500">
          Click or drag across chart to scrub time
        </div>
      </div>
    </div>
  );
};

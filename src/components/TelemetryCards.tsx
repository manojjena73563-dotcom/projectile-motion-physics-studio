import React from 'react';
import {
  SimulationMetrics,
  TrajectoryPoint,
  SimulationParams,
} from '../types/physics';
import {
  ArrowUp,
  MoveRight,
  Clock,
  Zap,
  Activity,
  Flame,
  Gauge,
  TrendingDown,
} from 'lucide-react';
import { sampleTrajectoryAtTime } from '../physics/engine';

interface TelemetryCardsProps {
  metrics: SimulationMetrics;
  points: TrajectoryPoint[];
  params: SimulationParams;
  currentTime: number;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  metrics,
  points,
  params,
  currentTime,
}) => {
  const currentPt = sampleTrajectoryAtTime(points, currentTime);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Max Height */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium flex items-center gap-1.5 text-slate-300">
            <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
            Max Height (Apex)
          </span>
          <span className="text-[10px] font-mono text-slate-500">t={metrics.timeToApex.toFixed(2)}s</span>
        </div>
        <div className="text-2xl font-black font-mono text-amber-400">
          {metrics.maxHeight.toFixed(2)} <span className="text-xs font-normal text-slate-400">m</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Apex dist:</span>
          <span className="font-mono text-slate-300">{metrics.apexX.toFixed(1)} m</span>
        </div>
      </div>

      {/* 2. Total Range */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium flex items-center gap-1.5 text-slate-300">
            <MoveRight className="w-3.5 h-3.5 text-cyan-400" />
            Total Range
          </span>
          {params.enableDrag && metrics.rangeDifferencePercent !== undefined && (
            <span className="text-[10px] font-mono text-rose-400 flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" />
              -{metrics.rangeDifferencePercent.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="text-2xl font-black font-mono text-cyan-400">
          {metrics.totalRange.toFixed(2)} <span className="text-xs font-normal text-slate-400">m</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>{params.enableDrag ? 'Ideal vacuum:' : 'Surface span:'}</span>
          <span className="font-mono text-slate-300">{metrics.idealRange.toFixed(1)} m</span>
        </div>
      </div>

      {/* 3. Time of Flight */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Time of Flight
          </span>
          <span className="text-[10px] font-mono text-emerald-400/80">
            {metrics.timeOfFlight > 0 ? (currentTime / metrics.timeOfFlight * 100).toFixed(0) : 0}% elapsed
          </span>
        </div>
        <div className="text-2xl font-black font-mono text-emerald-400">
          {metrics.timeOfFlight.toFixed(2)} <span className="text-xs font-normal text-slate-400">s</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Current pos:</span>
          <span className="font-mono text-slate-300">
            ({currentPt.x.toFixed(1)}m, {currentPt.y.toFixed(1)}m)
          </span>
        </div>
      </div>

      {/* 4. Impact Velocity & Energy */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-rose-500/50 transition-all">
        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium flex items-center gap-1.5 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            Impact Velocity
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            ∠ {metrics.impactAngleDeg.toFixed(1)}°
          </span>
        </div>
        <div className="text-2xl font-black font-mono text-rose-400">
          {metrics.impactVelocity.toFixed(2)} <span className="text-xs font-normal text-slate-400">m/s</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Inst. Energy:</span>
          <span className="font-mono text-slate-300">
            {currentPt.totalE.toFixed(1)} J
          </span>
        </div>
      </div>
    </div>
  );
};

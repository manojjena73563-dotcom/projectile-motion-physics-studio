import React, { useState } from 'react';
import { SimulationParams, SimulationMetrics } from '../types/physics';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Calculator,
  Compass,
  ArrowUp,
  Target,
  Wind,
  CheckCircle2,
} from 'lucide-react';

interface TheorySectionProps {
  params: SimulationParams;
  metrics: SimulationMetrics;
}

export const TheorySection: React.FC<TheorySectionProps> = ({ params, metrics }) => {
  const [isOpen, setIsOpen] = useState(false);

  const thetaRad = (params.angleDeg * Math.PI) / 180;
  const v0x = params.v0 * Math.cos(thetaRad);
  const v0y = params.v0 * Math.sin(thetaRad);

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-hidden shadow-xl">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Governing Physics Equations & Analytical Derivations
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                Interactive Formula Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live mathematical step-by-step evaluation using your current inputs
            </p>
          </div>
        </div>
        <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-slate-800 space-y-6 text-xs text-slate-300">
          {/* 1. Velocity Decomposition */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Compass className="w-4 h-4 text-cyan-400" />
              1. Initial Velocity Vector Decomposition
            </div>
            <p className="text-slate-400 leading-relaxed">
              In 2D projectile motion, horizontal and vertical kinematics are entirely independent. Gravity accelerates only vertically, while horizontal velocity remains invariant under ideal conditions:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-cyan-400 font-semibold mb-1">Horizontal Component (v₀x):</div>
                <div className="text-slate-200">v₀x = v₀ · cos(θ)</div>
                <div className="text-slate-400 text-[11px] mt-1">
                  = {params.v0.toFixed(1)} · cos({params.angleDeg.toFixed(0)}°) = <span className="text-cyan-300 font-bold">{v0x.toFixed(2)} m/s</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-amber-400 font-semibold mb-1">Vertical Component (v₀y):</div>
                <div className="text-slate-200">v₀y = v₀ · sin(θ)</div>
                <div className="text-slate-400 text-[11px] mt-1">
                  = {params.v0.toFixed(1)} · sin({params.angleDeg.toFixed(0)}°) = <span className="text-amber-300 font-bold">{v0y.toFixed(2)} m/s</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Kinematic Equations of Motion */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Calculator className="w-4 h-4 text-emerald-400" />
              2. Kinematic Trajectory Equations x(t) and y(t)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-emerald-400 font-semibold mb-1">Horizontal Position x(t):</div>
                <div className="text-slate-200">x(t) = v₀x · t</div>
                <div className="text-slate-400 text-[11px] mt-1">
                  x(t) = ({v0x.toFixed(2)}) · t
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-emerald-400 font-semibold mb-1">Vertical Position y(t):</div>
                <div className="text-slate-200">y(t) = y₀ + v₀y · t - ½ · g · t²</div>
                <div className="text-slate-400 text-[11px] mt-1">
                  y(t) = {params.y0.toFixed(1)} + ({v0y.toFixed(2)}) · t - 0.5 · ({params.gravity.toFixed(2)}) · t²
                </div>
              </div>
            </div>
          </div>

          {/* 3. Time of Flight Derivation */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Target className="w-4 h-4 text-purple-400" />
              3. Time of Flight (Quadratic Formula)
            </div>
            <p className="text-slate-400">
              Setting landing altitude <code className="text-slate-200">y(T) = 0</code> yields the standard quadratic equation:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono space-y-1.5">
              <div className="text-purple-300">½·g·t² - v₀y·t - y₀ = 0</div>
              <div className="text-slate-200">
                t_flight = (v₀y + √(v₀y² + 2·g·y₀)) / g
              </div>
              <div className="text-slate-400 text-[11px] pt-1">
                = ({v0y.toFixed(2)} + √({(v0y * v0y).toFixed(1)} + {(2 * params.gravity * params.y0).toFixed(1)})) / {params.gravity.toFixed(2)}
                {' = '}
                <span className="text-emerald-400 font-bold">{metrics.timeOfFlight.toFixed(2)} seconds</span>
              </div>
            </div>
          </div>

          {/* 4. Apex Peak Altitude */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <ArrowUp className="w-4 h-4 text-amber-400" />
              4. Maximum Altitude (Apex) Derivation
            </div>
            <p className="text-slate-400">
              At the peak apex, the projectile's vertical velocity momentarily drops to zero: <code className="text-slate-200">vy(t) = 0</code>.
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono space-y-1.5">
              <div className="text-amber-300">t_apex = v₀y / g</div>
              <div className="text-slate-200">H_max = y₀ + (v₀y²) / (2·g)</div>
              <div className="text-slate-400 text-[11px] pt-1">
                = {params.y0.toFixed(1)} + ({(v0y * v0y).toFixed(2)}) / ({(2 * params.gravity).toFixed(2)})
                {' = '}
                <span className="text-amber-400 font-bold">{metrics.maxHeight.toFixed(2)} meters</span>
              </div>
            </div>
          </div>

          {/* 5. Drag & RK4 Numerical Integration */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Wind className="w-4 h-4 text-rose-400" />
              5. Aerodynamic Drag & Runge-Kutta 4th Order (RK4)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Real projectiles face aerodynamic drag governed by the quadratic Rayleigh formula:
              <span className="font-mono text-rose-300 ml-1">Fd = ½ · ρ · Cd · A · v²</span>.
              Because drag couples horizontal and vertical velocities non-linearly, closed-form algebraic solutions do not exist. This application uses a high-precision 4th-order Runge-Kutta (RK4) solver with 5ms time slices.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-rose-400 font-bold">ax = </span> -(½ ρ Cd A v vx) / m
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-rose-400 font-bold">ay = </span> -g - (½ ρ Cd A v vy) / m
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

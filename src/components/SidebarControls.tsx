import React from 'react';
import {
  SimulationParams,
  CelestialPreset,
  ProjectilePreset,
} from '../types/physics';
import {
  CELESTIAL_PRESETS,
  PROJECTILE_PRESETS,
  calculateOptimalAngle,
} from '../physics/engine';
import {
  Compass,
  Gauge,
  ArrowUpRight,
  Globe2,
  Wind,
  Target,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';

interface SidebarControlsProps {
  params: SimulationParams;
  onChange: (updates: Partial<SimulationParams>) => void;
  onResetDefaults: () => void;
  isChallengeMode: boolean;
  onToggleChallenge: () => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  params,
  onChange,
  onResetDefaults,
  isChallengeMode,
  onToggleChallenge,
}) => {
  const currentPlanet = CELESTIAL_PRESETS.find((p) => p.id === params.selectedPlanetId);
  const optimalAngle = calculateOptimalAngle(params.v0, params.y0, params.gravity);

  const handlePlanetSelect = (planet: CelestialPreset) => {
    onChange({
      selectedPlanetId: planet.id,
      gravity: planet.gravity,
      airDensity: planet.atmosphereDensity,
    });
  };

  const handleProjectileSelect = (proj: ProjectilePreset) => {
    const area = Math.PI * proj.radius * proj.radius;
    onChange({
      selectedPresetId: proj.id,
      mass: proj.mass,
      dragCoeff: proj.dragCoeff,
      crossSectionArea: area,
      v0: proj.defaultV0,
    });
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-xl overflow-y-auto max-h-[calc(100vh-7rem)] custom-scrollbar">
      {/* Header with Title and Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Gauge className="w-4 h-4" />
            Simulation Controls
          </h2>
          <p className="text-xs text-slate-400">Configure launch parameters</p>
        </div>
        <button
          onClick={onResetDefaults}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Target Practice / Challenge Mode Toggle */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-700/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-xs font-bold text-indigo-200">Bullseye Challenge</div>
              <div className="text-[11px] text-indigo-300/70">Hit targets at randomized distances</div>
            </div>
          </div>
          <button
            onClick={onToggleChallenge}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isChallengeMode
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            {isChallengeMode ? 'Active' : 'Play'}
          </button>
        </div>
      </div>

      {/* 1. Initial Velocity (v0) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Initial Velocity (<span className="italic font-serif">v₀</span>)
          </label>
          <div className="font-mono text-cyan-400 font-bold bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
            {params.v0.toFixed(1)} m/s
          </div>
        </div>
        <input
          type="range"
          min={1.0}
          max={100.0}
          step={0.5}
          value={params.v0}
          onChange={(e) => onChange({ v0: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>1.0 m/s</span>
          <span>50.0 m/s</span>
          <span>100.0 m/s</span>
        </div>
      </div>

      {/* 2. Launch Angle (theta) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Launch Angle (<span className="italic font-serif">θ</span>)
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChange({ angleDeg: Math.round(optimalAngle) })}
              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              title={`Set to theoretical optimum for max range: ${optimalAngle.toFixed(1)}°`}
            >
              Opt: {optimalAngle.toFixed(0)}°
            </button>
            <div className="font-mono text-amber-400 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
              {params.angleDeg.toFixed(1)}°
            </div>
          </div>
        </div>
        <input
          type="range"
          min={0.0}
          max={90.0}
          step={1.0}
          value={params.angleDeg}
          onChange={(e) => onChange({ angleDeg: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span onClick={() => onChange({ angleDeg: 0 })} className="cursor-pointer hover:text-slate-300">
            0° (Horiz)
          </span>
          <span onClick={() => onChange({ angleDeg: 45 })} className="cursor-pointer hover:text-slate-300">
            45° (Max)
          </span>
          <span onClick={() => onChange({ angleDeg: 90 })} className="cursor-pointer hover:text-slate-300">
            90° (Vert)
          </span>
        </div>
      </div>

      {/* 3. Initial Height (y0) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-slate-200 flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            Launch Platform Height (<span className="italic font-serif">y₀</span>)
          </label>
          <div className="font-mono text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
            {params.y0.toFixed(1)} m
          </div>
        </div>
        <input
          type="range"
          min={0.0}
          max={60.0}
          step={1.0}
          value={params.y0}
          onChange={(e) => onChange({ y0: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span onClick={() => onChange({ y0: 0 })} className="cursor-pointer hover:text-slate-300">
            Ground (0m)
          </span>
          <span>30m</span>
          <span>60m (Tower)</span>
        </div>
      </div>

      {/* 4. Gravitational Acceleration (Dynamic Slider + Presets) */}
      <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-purple-400" />
            Gravitational Acceleration (<span className="italic font-serif">g</span>)
          </label>
          <div className="font-mono text-purple-400 font-bold bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/50">
            {params.gravity.toFixed(2)} m/s²
          </div>
        </div>

        {/* Dynamic Gravity Slider */}
        <input
          type="range"
          min={0.5}
          max={30.0}
          step={0.1}
          value={params.gravity}
          onChange={(e) => {
            const newG = parseFloat(e.target.value);
            const matchedPlanet = CELESTIAL_PRESETS.find(
              (p) => Math.abs(p.gravity - newG) < 0.05
            );
            onChange({
              gravity: newG,
              selectedPlanetId: matchedPlanet ? matchedPlanet.id : 'custom',
            });
          }}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
        />

        {/* Quick Celestial Body Preset Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {CELESTIAL_PRESETS.map((planet) => {
            const isSelected = params.selectedPlanetId === planet.id;
            return (
              <button
                key={planet.id}
                onClick={() => handlePlanetSelect(planet)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all text-xs ${
                  isSelected
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-semibold'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                title={planet.description}
              >
                <span>{planet.icon}</span>
                <div className="overflow-hidden">
                  <div className="truncate leading-tight">{planet.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {planet.gravity.toFixed(1)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Projectile Presets */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Projectile Type
          </label>
          <span className="text-[11px] font-mono text-slate-400">{params.mass.toFixed(3)} kg</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {PROJECTILE_PRESETS.map((proj) => {
            const isSelected = params.selectedPresetId === proj.id;
            return (
              <button
                key={proj.id}
                onClick={() => handleProjectileSelect(proj)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-left transition-all text-xs ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span>{proj.icon}</span>
                <span className="truncate">{proj.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Aerodynamic Drag / Air Resistance (RK4) */}
      <div className="space-y-3 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-rose-400" />
            Air Resistance (Drag)
          </label>
          <button
            onClick={() => onChange({ enableDrag: !params.enableDrag })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              params.enableDrag ? 'bg-rose-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                params.enableDrag ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {params.enableDrag && (
          <div className="space-y-3 p-3 rounded-xl bg-rose-950/20 border border-rose-800/30 text-xs">
            {/* Air Density */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Air Density (ρ)</span>
                <span className="font-mono text-rose-300">{params.airDensity.toFixed(3)} kg/m³</span>
              </div>
              <input
                type="range"
                min={0}
                max={5.0}
                step={0.05}
                value={params.airDensity}
                onChange={(e) => onChange({ airDensity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
            </div>

            {/* Drag Coefficient */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Drag Coeff (Cd)</span>
                <span className="font-mono text-rose-300">{params.dragCoeff.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1.5}
                step={0.05}
                value={params.dragCoeff}
                onChange={(e) => onChange({ dragCoeff: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
            </div>

            <div className="text-[10px] text-slate-400 flex items-start gap-1">
              <Info className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
              <span>Simulated with Runge-Kutta 4th order (RK4) quadratic drag.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

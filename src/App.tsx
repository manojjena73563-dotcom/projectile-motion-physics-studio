import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  SimulationParams,
  GhostRun,
  TargetObjective,
} from './types/physics';
import {
  calculateTrajectory,
  calculateVacuumTrajectory,
  CELESTIAL_PRESETS,
  PROJECTILE_PRESETS,
} from './physics/engine';
import { Header } from './components/Header';
import { SidebarControls } from './components/SidebarControls';
import { SimulationCanvas } from './components/SimulationCanvas';
import { TelemetryCards } from './components/TelemetryCards';
import { TelemetryCharts } from './components/TelemetryCharts';
import { TheorySection } from './components/TheorySection';
import { DataTableModal } from './components/DataTableModal';

const DEFAULT_PARAMS: SimulationParams = {
  v0: 25.0,
  angleDeg: 45.0,
  y0: 0.0,
  gravity: 9.81,
  enableDrag: false,
  airDensity: 1.225,
  mass: 5.0,
  dragCoeff: 0.47,
  crossSectionArea: Math.PI * 0.06 * 0.06,
  selectedPlanetId: 'earth',
  selectedPresetId: 'cannonball',
};

const GHOST_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f472b6'];

export default function App() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showApexMarker, setShowApexMarker] = useState<boolean>(true);

  const [ghostRuns, setGhostRuns] = useState<GhostRun[]>([]);
  const [isDataTableOpen, setIsDataTableOpen] = useState<boolean>(false);

  // Target practice challenge
  const [isChallengeMode, setIsChallengeMode] = useState<boolean>(false);
  const [target, setTarget] = useState<TargetObjective | null>(null);
  const [score, setScore] = useState<number>(0);

  // Compute Active Trajectory and Metrics
  const { points, metrics } = useMemo(() => {
    return calculateTrajectory(params);
  }, [params]);

  // Compute vacuum trajectory for overlay comparison when drag is enabled
  const vacuumData = useMemo(() => {
    if (!params.enableDrag) return undefined;
    return calculateVacuumTrajectory(params);
  }, [params]);

  // Reset or adjust currentTime if timeOfFlight changes
  useEffect(() => {
    if (currentTime > metrics.timeOfFlight) {
      setCurrentTime(metrics.timeOfFlight);
    }
  }, [metrics.timeOfFlight, currentTime]);

  const handleParamsChange = (updates: Partial<SimulationParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  };

  const handleResetDefaults = () => {
    setParams(DEFAULT_PARAMS);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Add current run as a ghost comparison trace
  const handleAddGhost = () => {
    if (ghostRuns.length >= 4) {
      // Keep last 3 and add new
      const nextColor = GHOST_COLORS[ghostRuns.length % GHOST_COLORS.length];
      const newGhost: GhostRun = {
        id: Date.now().toString(),
        label: `${params.v0}m/s @ ${params.angleDeg}° (g=${params.gravity.toFixed(1)})`,
        color: nextColor,
        v0: params.v0,
        angleDeg: params.angleDeg,
        y0: params.y0,
        gravity: params.gravity,
        enableDrag: params.enableDrag,
        points: [...points],
        metrics: { ...metrics },
      };
      setGhostRuns([...ghostRuns.slice(1), newGhost]);
      return;
    }

    const nextColor = GHOST_COLORS[ghostRuns.length % GHOST_COLORS.length];
    const newGhost: GhostRun = {
      id: Date.now().toString(),
      label: `${params.v0}m/s @ ${params.angleDeg}° (g=${params.gravity.toFixed(1)})`,
      color: nextColor,
      v0: params.v0,
      angleDeg: params.angleDeg,
      y0: params.y0,
      gravity: params.gravity,
      enableDrag: params.enableDrag,
      points: [...points],
      metrics: { ...metrics },
    };
    setGhostRuns([...ghostRuns, newGhost]);
  };

  const handleClearGhosts = () => {
    setGhostRuns([]);
  };

  // Generate randomized challenge target
  const spawnNewTarget = useCallback(() => {
    const randomDistance = Math.floor(Math.random() * 80) + 25; // 25m to 105m
    const randomHeight = Math.random() > 0.4 ? Math.floor(Math.random() * 20) : 0; // sometimes in air
    setTarget({
      x: randomDistance,
      y: randomHeight,
      radius: 2.5,
      hit: false,
    });
  }, []);

  const handleToggleChallenge = () => {
    if (!isChallengeMode) {
      setIsChallengeMode(true);
      spawnNewTarget();
    } else {
      setIsChallengeMode(false);
      setTarget(null);
    }
  };

  const handleTargetHit = () => {
    setScore((s) => s + 100);
    setTimeout(() => {
      spawnNewTarget();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenDataTable={() => setIsDataTableOpen(true)}
        isChallengeMode={isChallengeMode}
        onToggleChallenge={handleToggleChallenge}
        score={score}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Sidebar Controls (4 cols on lg) */}
        <div className="lg:col-span-4 w-full">
          <SidebarControls
            params={params}
            onChange={handleParamsChange}
            onResetDefaults={handleResetDefaults}
            isChallengeMode={isChallengeMode}
            onToggleChallenge={handleToggleChallenge}
          />
        </div>

        {/* Right Column: Interactive Canvas, Telemetry & Analysis (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-5 w-full">
          {/* Key Metrics HUD Cards */}
          <TelemetryCards
            metrics={metrics}
            points={points}
            params={params}
            currentTime={currentTime}
          />

          {/* Interactive Visualizer Canvas */}
          <SimulationCanvas
            points={points}
            vacuumPoints={vacuumData?.points}
            metrics={metrics}
            params={params}
            onParamsChange={handleParamsChange}
            ghostRuns={ghostRuns}
            onAddGhost={handleAddGhost}
            onClearGhosts={handleClearGhosts}
            target={target}
            onTargetHit={handleTargetHit}
            showVectors={showVectors}
            setShowVectors={setShowVectors}
            showApexMarker={showApexMarker}
            setShowApexMarker={setShowApexMarker}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
          />

          {/* Kinematics & Energy Telemetry Graphs */}
          <TelemetryCharts
            points={points}
            metrics={metrics}
            params={params}
            currentTime={currentTime}
            onScrubTime={(t) => {
              setIsPlaying(false);
              setCurrentTime(t);
            }}
          />

          {/* Interactive Governing Physics Equations & Derivations */}
          <TheorySection params={params} metrics={metrics} />
        </div>
      </main>

      {/* Dataset & CSV Export Modal */}
      <DataTableModal
        isOpen={isDataTableOpen}
        onClose={() => setIsDataTableOpen(false)}
        points={points}
        metrics={metrics}
        params={params}
      />
    </div>
  );
}

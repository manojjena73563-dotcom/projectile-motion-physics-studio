export interface CelestialPreset {
  id: string;
  name: string;
  gravity: number; // m/s²
  atmosphereDensity: number; // kg/m³
  surfaceColor: string;
  skyColor: string;
  gridColor: string;
  icon: string;
  description: string;
}

export interface ProjectilePreset {
  id: string;
  name: string;
  mass: number; // kg
  radius: number; // m
  dragCoeff: number; // Cd
  defaultV0: number; // m/s
  icon: string;
}

export interface SimulationParams {
  v0: number; // Initial velocity (m/s)
  angleDeg: number; // Launch angle (degrees)
  y0: number; // Initial height (meters)
  gravity: number; // Gravitational acceleration (m/s²)
  enableDrag: boolean; // Air resistance toggle
  airDensity: number; // Air density (kg/m³)
  mass: number; // Projectile mass (kg)
  dragCoeff: number; // Drag coefficient Cd
  crossSectionArea: number; // Cross sectional area (m²)
  selectedPlanetId: string;
  selectedPresetId: string;
}

export interface TrajectoryPoint {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  ke: number; // Kinetic energy (J)
  pe: number; // Potential energy (J)
  totalE: number; // Total energy (J)
}

export interface SimulationMetrics {
  maxHeight: number;
  timeToApex: number;
  apexX: number;
  totalRange: number;
  timeOfFlight: number;
  impactVelocity: number;
  impactAngleDeg: number;
  idealRange: number; // without drag
  rangeDifferencePercent?: number; // difference due to drag
}

export interface GhostRun {
  id: string;
  label: string;
  color: string;
  v0: number;
  angleDeg: number;
  y0: number;
  gravity: number;
  enableDrag: boolean;
  points: TrajectoryPoint[];
  metrics: SimulationMetrics;
}

export interface TargetObjective {
  x: number; // distance
  y: number; // elevation
  radius: number; // target radius
  hit: boolean;
}

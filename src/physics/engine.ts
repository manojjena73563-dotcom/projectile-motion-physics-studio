import {
  CelestialPreset,
  ProjectilePreset,
  SimulationParams,
  TrajectoryPoint,
  SimulationMetrics,
} from '../types/physics';

export const CELESTIAL_PRESETS: CelestialPreset[] = [
  {
    id: 'earth',
    name: 'Earth',
    gravity: 9.81,
    atmosphereDensity: 1.225,
    surfaceColor: '#22c55e',
    skyColor: '#0ea5e9',
    gridColor: 'rgba(56, 189, 248, 0.15)',
    icon: '🌍',
    description: 'Standard terrestrial gravity (1.00 g). Air density 1.225 kg/m³.',
  },
  {
    id: 'moon',
    name: 'The Moon',
    gravity: 1.62,
    atmosphereDensity: 0.0,
    surfaceColor: '#94a3b8',
    skyColor: '#020617',
    gridColor: 'rgba(148, 163, 184, 0.15)',
    icon: '🌘',
    description: 'Low gravity (0.165 g), absolute vacuum. Massive trajectories!',
  },
  {
    id: 'mars',
    name: 'Mars',
    gravity: 3.71,
    atmosphereDensity: 0.02,
    surfaceColor: '#f97316',
    skyColor: '#451a03',
    gridColor: 'rgba(249, 115, 22, 0.15)',
    icon: '🔴',
    description: 'Red planet (0.38 g) with thin carbon-dioxide atmosphere.',
  },
  {
    id: 'venus',
    name: 'Venus',
    gravity: 8.87,
    atmosphereDensity: 65.0,
    surfaceColor: '#eab308',
    skyColor: '#78350f',
    gridColor: 'rgba(234, 179, 8, 0.15)',
    icon: '🌕',
    description: 'Dense crushing atmosphere (65 kg/m³) with 0.90 g gravity.',
  },
  {
    id: 'jupiter',
    name: 'Jupiter Cloud-tops',
    gravity: 24.79,
    atmosphereDensity: 0.2,
    surfaceColor: '#d97706',
    skyColor: '#292524',
    gridColor: 'rgba(217, 119, 6, 0.15)',
    icon: '🪐',
    description: 'Crushing super-gravity (2.53 g). Rapid plummeting descent.',
  },
  {
    id: 'titan',
    name: 'Titan (Saturn Moon)',
    gravity: 1.35,
    atmosphereDensity: 5.3,
    surfaceColor: '#10b981',
    skyColor: '#064e3b',
    gridColor: 'rgba(16, 185, 129, 0.15)',
    icon: '🌑',
    description: 'Low gravity with dense nitrogen atmosphere. Extreme drag!',
  },
];

export const PROJECTILE_PRESETS: ProjectilePreset[] = [
  {
    id: 'cannonball',
    name: 'Iron Cannonball',
    mass: 5.0, // 5 kg
    radius: 0.06, // 6 cm radius
    dragCoeff: 0.47, // sphere
    defaultV0: 40.0,
    icon: '💣',
  },
  {
    id: 'baseball',
    name: 'Baseball',
    mass: 0.145, // 145 grams
    radius: 0.037, // 3.7 cm
    dragCoeff: 0.32,
    defaultV0: 38.0, // ~85 mph
    icon: '⚾',
  },
  {
    id: 'golfball',
    name: 'Golf Ball',
    mass: 0.0459, // 45.9 grams
    radius: 0.0213, // 2.13 cm
    dragCoeff: 0.25, // dimpled sphere
    defaultV0: 65.0,
    icon: '⛳',
  },
  {
    id: 'pingpong',
    name: 'Ping Pong Ball',
    mass: 0.0027, // 2.7 grams
    radius: 0.02, // 2 cm
    dragCoeff: 0.45,
    defaultV0: 20.0,
    icon: '🏓',
  },
  {
    id: 'arrow',
    name: 'Archery Arrow',
    mass: 0.025, // 25 grams
    radius: 0.005, // 5 mm shaft
    dragCoeff: 0.18,
    defaultV0: 75.0,
    icon: '🏹',
  },
  {
    id: 'boulder',
    name: 'Heavy Boulder',
    mass: 120.0,
    radius: 0.25,
    dragCoeff: 0.65,
    defaultV0: 25.0,
    icon: '🪨',
  },
];

/**
 * Calculates ideal analytical vacuum trajectory
 */
export function calculateVacuumTrajectory(params: SimulationParams, numPoints = 600): {
  points: TrajectoryPoint[];
  metrics: SimulationMetrics;
} {
  const { v0, angleDeg, y0, gravity: g, mass } = params;
  const theta = (angleDeg * Math.PI) / 180;

  const v0x = v0 * Math.cos(theta);
  const v0y = v0 * Math.sin(theta);

  // Time to apex: vy = 0 => v0y - g*t = 0
  const timeToApex = v0y > 0 ? v0y / g : 0;
  const maxHeight = y0 + (v0y > 0 ? (v0y * v0y) / (2 * g) : 0);
  const apexX = v0x * timeToApex;

  // Total time of flight using quadratic equation: y0 + v0y*t - 0.5*g*t^2 = 0
  // -0.5*g*t^2 + v0y*t + y0 = 0
  // discriminant = v0y^2 + 2 * g * y0
  const discriminant = v0y * v0y + 2 * g * y0;
  const timeOfFlight = Math.max(0.001, (v0y + Math.sqrt(Math.max(0, discriminant))) / g);

  const totalRange = v0x * timeOfFlight;
  const vyImpact = v0y - g * timeOfFlight;
  const impactVelocity = Math.sqrt(v0x * v0x + vyImpact * vyImpact);
  const impactAngleDeg = (Math.atan2(Math.abs(vyImpact), v0x) * 180) / Math.PI;

  const points: TrajectoryPoint[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * timeOfFlight;
    const x = v0x * t;
    const y = Math.max(0, y0 + v0y * t - 0.5 * g * t * t);
    const vy = v0y - g * t;
    const speed = Math.sqrt(v0x * v0x + vy * vy);
    const ke = 0.5 * mass * speed * speed;
    const pe = mass * g * y;

    points.push({
      t,
      x,
      y,
      vx: v0x,
      vy,
      speed,
      ke,
      pe,
      totalE: ke + pe,
    });
  }

  const metrics: SimulationMetrics = {
    maxHeight,
    timeToApex,
    apexX,
    totalRange,
    timeOfFlight,
    impactVelocity,
    impactAngleDeg,
    idealRange: totalRange,
  };

  return { points, metrics };
}

/**
 * Calculates trajectory with aerodynamic drag using Runge-Kutta 4 (RK4)
 */
export function calculateDragTrajectory(params: SimulationParams): {
  points: TrajectoryPoint[];
  metrics: SimulationMetrics;
} {
  const {
    v0,
    angleDeg,
    y0,
    gravity: g,
    airDensity: rho,
    dragCoeff: cd,
    crossSectionArea: area,
    mass,
  } = params;

  // Drag constant factor: k = 0.5 * rho * Cd * A
  const k = 0.5 * rho * cd * area;

  const theta = (angleDeg * Math.PI) / 180;
  let vx = v0 * Math.cos(theta);
  let vy = v0 * Math.sin(theta);
  let x = 0;
  let y = y0;
  let t = 0;

  const dt = 0.005; // 5ms step for precise integration
  const points: TrajectoryPoint[] = [];

  // Helper derivatives for RK4: state = [x, y, vx, vy]
  const derivatives = (curVx: number, curVy: number) => {
    const v = Math.sqrt(curVx * curVx + curVy * curVy);
    if (v < 1e-9) {
      return { dx: curVx, dy: curVy, dvx: 0, dvy: -g };
    }
    const dragForce = k * v * v;
    const ax = -(dragForce * (curVx / v)) / mass;
    const ay = -g - (dragForce * (curVy / v)) / mass;
    return { dx: curVx, dy: curVy, dvx: ax, dvy: ay };
  };

  let maxHeight = y;
  let timeToApex = 0;
  let apexX = 0;
  let reachedApex = false;

  // Add initial point
  const initialSpeed = Math.sqrt(vx * vx + vy * vy);
  points.push({
    t: 0,
    x: 0,
    y: y0,
    vx,
    vy,
    speed: initialSpeed,
    ke: 0.5 * mass * initialSpeed * initialSpeed,
    pe: mass * g * y0,
    totalE: 0.5 * mass * initialSpeed * initialSpeed + mass * g * y0,
  });

  const maxDuration = 1000; // safety ceiling
  let sampleIntervalCounter = 0;

  while (y >= 0 && t < maxDuration) {
    const prevVy = vy;

    // RK4 Integration
    const k1 = derivatives(vx, vy);
    const k2 = derivatives(vx + 0.5 * dt * k1.dvx, vy + 0.5 * dt * k1.dvy);
    const k3 = derivatives(vx + 0.5 * dt * k2.dvx, vy + 0.5 * dt * k2.dvy);
    const k4 = derivatives(vx + dt * k3.dvx, vy + dt * k3.dvy);

    x += (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
    y += (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
    vx += (dt / 6) * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx);
    vy += (dt / 6) * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy);
    t += dt;

    if (y > maxHeight) {
      maxHeight = y;
    }

    if (!reachedApex && prevVy > 0 && vy <= 0) {
      reachedApex = true;
      timeToApex = t;
      apexX = x;
    }

    sampleIntervalCounter++;
    // Downsample for clean array (around 400-600 points)
    if (sampleIntervalCounter % 4 === 0 || y < 0) {
      const speed = Math.sqrt(vx * vx + vy * vy);
      const curY = Math.max(0, y);
      const ke = 0.5 * mass * speed * speed;
      const pe = mass * g * curY;
      points.push({
        t,
        x,
        y: curY,
        vx,
        vy,
        speed,
        ke,
        pe,
        totalE: ke + pe,
      });
    }
  }

  // Final impact adjustments
  const lastPt = points[points.length - 1];
  const impactVelocity = Math.sqrt(lastPt.vx * lastPt.vx + lastPt.vy * lastPt.vy);
  const impactAngleDeg = (Math.atan2(Math.abs(lastPt.vy), Math.max(0.01, lastPt.vx)) * 180) / Math.PI;

  const ideal = calculateVacuumTrajectory(params);

  const metrics: SimulationMetrics = {
    maxHeight,
    timeToApex: timeToApex || (y0 === maxHeight ? 0 : t / 2),
    apexX: apexX || x / 2,
    totalRange: x,
    timeOfFlight: t,
    impactVelocity,
    impactAngleDeg,
    idealRange: ideal.metrics.totalRange,
    rangeDifferencePercent: ideal.metrics.totalRange > 0
      ? ((ideal.metrics.totalRange - x) / ideal.metrics.totalRange) * 100
      : 0,
  };

  return { points, metrics };
}

/**
 * Main trajectory dispatcher
 */
export function calculateTrajectory(params: SimulationParams) {
  if (params.enableDrag && params.airDensity > 0) {
    return calculateDragTrajectory(params);
  }
  return calculateVacuumTrajectory(params);
}

/**
 * Calculates theoretical optimal launch angle for maximum range
 * For flat ground (y0 = 0), optimal angle = 45°.
 * For elevated launch (y0 > 0), optimal angle = arcsin( 1 / sqrt(2 + 2*g*y0 / v0^2) )
 */
export function calculateOptimalAngle(v0: number, y0: number, g: number): number {
  if (y0 <= 0) return 45;
  const factor = 2 + (2 * g * y0) / (v0 * v0);
  const sinThetaOpt = 1 / Math.sqrt(factor);
  const thetaRad = Math.asin(sinThetaOpt);
  return (thetaRad * 180) / Math.PI;
}

/**
 * Interpolates state at arbitrary time t
 */
export function sampleTrajectoryAtTime(points: TrajectoryPoint[], t: number): TrajectoryPoint {
  if (!points || points.length === 0) {
    return { t: 0, x: 0, y: 0, vx: 0, vy: 0, speed: 0, ke: 0, pe: 0, totalE: 0 };
  }
  if (t <= points[0].t) return points[0];
  if (t >= points[points.length - 1].t) return points[points.length - 1];

  // Binary search
  let low = 0;
  let high = points.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (points[mid].t === t) return points[mid];
    if (points[mid].t < t) low = mid + 1;
    else high = mid - 1;
  }

  const p0 = points[Math.max(0, high)];
  const p1 = points[Math.min(points.length - 1, low)];
  const span = p1.t - p0.t;
  if (span <= 1e-6) return p0;

  const alpha = (t - p0.t) / span;

  return {
    t,
    x: p0.x + alpha * (p1.x - p0.x),
    y: Math.max(0, p0.y + alpha * (p1.y - p0.y)),
    vx: p0.vx + alpha * (p1.vx - p0.vx),
    vy: p0.vy + alpha * (p1.vy - p0.vy),
    speed: p0.speed + alpha * (p1.speed - p0.speed),
    ke: p0.ke + alpha * (p1.ke - p0.ke),
    pe: p0.pe + alpha * (p1.pe - p0.pe),
    totalE: p0.totalE + alpha * (p1.totalE - p0.totalE),
  };
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Sliders,
  Eye,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import {
  TrajectoryPoint,
  SimulationMetrics,
  GhostRun,
  TargetObjective,
  SimulationParams,
} from '../types/physics';
import { CELESTIAL_PRESETS, sampleTrajectoryAtTime } from '../physics/engine';
import confetti from 'canvas-confetti';

interface SimulationCanvasProps {
  points: TrajectoryPoint[];
  vacuumPoints?: TrajectoryPoint[];
  metrics: SimulationMetrics;
  params: SimulationParams;
  onParamsChange: (newParams: Partial<SimulationParams>) => void;
  ghostRuns: GhostRun[];
  onAddGhost: () => void;
  onClearGhosts: () => void;
  target: TargetObjective | null;
  onTargetHit?: () => void;
  showVectors: boolean;
  setShowVectors: (val: boolean) => void;
  showApexMarker: boolean;
  setShowApexMarker: (val: boolean) => void;
  currentTime: number;
  setCurrentTime: (t: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  points,
  vacuumPoints,
  metrics,
  params,
  onParamsChange,
  ghostRuns,
  onAddGhost,
  onClearGhosts,
  target,
  onTargetHit,
  showVectors,
  setShowVectors,
  showApexMarker,
  setShowApexMarker,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport / Camera state
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Direct canvas manipulation of cannon angle & height
  const [isDraggingAngle, setIsDraggingAngle] = useState(false);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);

  const [hasCelebratedHit, setHasCelebratedHit] = useState(false);

  // Get current celestial preset
  const planet = CELESTIAL_PRESETS.find((p) => p.id === params.selectedPlanetId) || CELESTIAL_PRESETS[0];

  // Animation frame loop
  useEffect(() => {
    let animId: number;
    let lastTimestamp: number | null = null;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying && metrics.timeOfFlight > 0) {
        setCurrentTime((prev) => {
          const next = prev + deltaTime * playbackSpeed;
          if (next >= metrics.timeOfFlight) {
            return metrics.timeOfFlight; // Stop at landing
          }
          return next;
        });
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, metrics.timeOfFlight, playbackSpeed, setCurrentTime]);

  // Pause when reaching landing
  useEffect(() => {
    if (currentTime >= metrics.timeOfFlight && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentTime, metrics.timeOfFlight, isPlaying, setIsPlaying]);

  // Target Hit Detection
  useEffect(() => {
    if (!target) return;
    const currentPt = sampleTrajectoryAtTime(points, currentTime);
    const distToTarget = Math.sqrt(
      Math.pow(currentPt.x - target.x, 2) + Math.pow(currentPt.y - target.y, 2)
    );

    if (distToTarget <= target.radius + 1.2 && !hasCelebratedHit) {
      setHasCelebratedHit(true);
      if (onTargetHit) onTargetHit();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e'],
      });
    }
  }, [currentTime, points, target, hasCelebratedHit, onTargetHit]);

  // Reset hit celebration flag when params change
  useEffect(() => {
    setHasCelebratedHit(false);
  }, [params.v0, params.angleDeg, params.y0, params.gravity]);

  // Compute World to Screen transform
  const getTransform = useCallback(() => {
    const canvas = canvasRef.current;
    const paddingX = 80;
    const paddingY = 80;

    const fallback = {
      originX: 60,
      originY: 300,
      scale: 4,
      width: 800,
      height: 400,
      maxRange: 100,
      maxHeight: 50,
      toScreen: (x: number, y: number) => ({ sx: 60 + x * 4, sy: 300 - y * 4 }),
      toWorld: (sx: number, sy: number) => ({ wx: (sx - 60) / 4, wy: (300 - sy) / 4 }),
    };

    if (!canvas) return fallback;

    const width = canvas.width;
    const height = canvas.height;

    // Determine max physics dimensions with padding
    const maxRange = Math.max(metrics.totalRange, target ? target.x + 20 : 0, 30);
    const maxHeight = Math.max(metrics.maxHeight, target ? target.y + 10 : 0, params.y0 + 10, 15);

    const availableW = width - paddingX * 2;
    const availableH = height - paddingY * 2;

    const scaleX = availableW / (maxRange * 1.15);
    const scaleY = availableH / (maxHeight * 1.25);
    const baseScale = Math.min(scaleX, scaleY);
    const scale = Math.max(0.2, baseScale * zoom);

    const originX = paddingX + panOffset.x;
    const originY = height - paddingY + panOffset.y;

    const toScreen = (x: number, y: number) => ({
      sx: originX + x * scale,
      sy: originY - y * scale,
    });

    const toWorld = (sx: number, sy: number) => ({
      wx: (sx - originX) / scale,
      wy: (originY - sy) / scale,
    });

    return { originX, originY, scale, width, height, toScreen, toWorld, maxRange, maxHeight };
  }, [metrics.totalRange, metrics.maxHeight, target, params.y0, zoom, panOffset]);

  // Draw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    const { originX, originY, scale, toScreen, maxRange, maxHeight } = getTransform();

    // 1. Background sky & atmospheric glow
    const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
    bgGradient.addColorStop(0, '#090d16');
    bgGradient.addColorStop(0.7, '#0f172a');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    // Subtle planet atmospheric halo
    const radialGlow = ctx.createRadialGradient(originX, originY, 10, originX + 200, originY - 100, 500);
    radialGlow.addColorStop(0, planet.gridColor);
    radialGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, w, h);

    // 2. Physics Grid System
    // Choose step size dynamically based on scale
    let gridStep = 5;
    if (scale < 1) gridStep = 50;
    else if (scale < 3) gridStep = 20;
    else if (scale < 8) gridStep = 10;
    else gridStep = 5;

    ctx.lineWidth = 1;

    // Vertical grid lines
    const startX = 0;
    const endX = Math.ceil((maxRange * 1.5) / gridStep) * gridStep;
    for (let gx = startX; gx <= endX; gx += gridStep) {
      const { sx } = toScreen(gx, 0);
      if (sx >= 0 && sx <= w) {
        ctx.strokeStyle = gx % (gridStep * 2) === 0 ? 'rgba(51, 65, 85, 0.45)' : 'rgba(30, 41, 59, 0.3)';
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
        ctx.stroke();

        // X-axis label
        if (gx % (gridStep * 2) === 0) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
          ctx.font = '10px "Fira Code", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${gx}m`, sx, originY + 18);
        }
      }
    }

    // Horizontal grid lines
    const startY = 0;
    const endY = Math.ceil((maxHeight * 1.5) / gridStep) * gridStep;
    for (let gy = startY; gy <= endY; gy += gridStep) {
      const { sy } = toScreen(0, gy);
      if (sy >= 0 && sy <= h) {
        ctx.strokeStyle = gy % (gridStep * 2) === 0 ? 'rgba(51, 65, 85, 0.45)' : 'rgba(30, 41, 59, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
        ctx.stroke();

        // Y-axis label
        if (gy % (gridStep * 2) === 0 && gy > 0) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
          ctx.font = '10px "Fira Code", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${gy}m`, originX - 10, sy + 3);
        }
      }
    }

    // 3. Ground / Surface Terrain
    ctx.strokeStyle = planet.surfaceColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(w, originY);
    ctx.stroke();

    // Ground fill underneath
    const groundFill = ctx.createLinearGradient(0, originY, 0, h);
    groundFill.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    groundFill.addColorStop(1, '#020617');
    ctx.fillStyle = groundFill;
    ctx.fillRect(0, originY, w, h - originY);

    // Ground hatching / texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let hx = 0; hx < w; hx += 16) {
      ctx.beginPath();
      ctx.moveTo(hx, originY);
      ctx.lineTo(hx - 12, originY + 24);
      ctx.stroke();
    }

    // Ground reference (0, 0) tick
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px "Fira Code", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('0,0', originX - 6, originY + 16);

    // 4. Ghost Trajectories (from previous comparative launches)
    ghostRuns.forEach((ghost) => {
      if (!ghost.points || ghost.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = ghost.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const first = toScreen(ghost.points[0].x, ghost.points[0].y);
      ctx.moveTo(first.sx, first.sy);
      for (let i = 1; i < ghost.points.length; i++) {
        const p = toScreen(ghost.points[i].x, ghost.points[i].y);
        ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();

      // Ghost landing badge
      const last = toScreen(ghost.metrics.totalRange, 0);
      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      ctx.arc(last.sx, last.sy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '9px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${ghost.label} (${ghost.metrics.totalRange.toFixed(1)}m)`, last.sx, last.sy - 8);
      ctx.restore();
    });

    // 5. Ideal Vacuum Trajectory (if drag is enabled, to highlight drag comparison)
    if (params.enableDrag && vacuumPoints && vacuumPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      const v0s = toScreen(vacuumPoints[0].x, vacuumPoints[0].y);
      ctx.moveTo(v0s.sx, v0s.sy);
      for (let i = 1; i < vacuumPoints.length; i++) {
        const vp = toScreen(vacuumPoints[i].x, vacuumPoints[i].y);
        ctx.lineTo(vp.sx, vp.sy);
      }
      ctx.stroke();

      // Label for vacuum curve
      const midIdx = Math.floor(vacuumPoints.length * 0.45);
      const midPt = toScreen(vacuumPoints[midIdx].x, vacuumPoints[midIdx].y);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Vacuum Ideal (No Drag)', midPt.sx + 8, midPt.sy - 8);
      ctx.restore();
    }

    // 6. Active Trajectory Curve
    if (points.length > 1) {
      ctx.save();
      // Glow under glow
      ctx.shadowColor = params.enableDrag ? '#f43f5e' : '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = params.enableDrag ? '#fb7185' : '#38bdf8';
      ctx.lineWidth = 3.5;

      ctx.beginPath();
      const first = toScreen(points[0].x, points[0].y);
      ctx.moveTo(first.sx, first.sy);
      for (let i = 1; i < points.length; i++) {
        const p = toScreen(points[i].x, points[i].y);
        ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 7. Apex Peak Marker
    if (showApexMarker && metrics.timeToApex > 0) {
      const apexScreen = toScreen(metrics.apexX, metrics.maxHeight);
      ctx.save();
      // Dashed drop line to ground
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(apexScreen.sx, apexScreen.sy);
      ctx.lineTo(apexScreen.sx, originY);
      ctx.stroke();

      // Apex point glow
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(apexScreen.sx, apexScreen.sy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Apex Badge
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      const badgeText = `Apex: ${metrics.maxHeight.toFixed(1)}m`;
      ctx.font = '11px "Fira Code", monospace';
      const textW = ctx.measureText(badgeText).width;
      ctx.fillRect(apexScreen.sx - textW / 2 - 6, apexScreen.sy - 28, textW + 12, 18);
      ctx.strokeRect(apexScreen.sx - textW / 2 - 6, apexScreen.sy - 28, textW + 12, 18);

      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, apexScreen.sx, apexScreen.sy - 15);
      ctx.restore();
    }

    // 8. Landing / Impact Marker
    const landingScreen = toScreen(metrics.totalRange, 0);
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(landingScreen.sx, landingScreen.sy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Landing flag / cross
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(landingScreen.sx - 8, landingScreen.sy);
    ctx.lineTo(landingScreen.sx + 8, landingScreen.sy);
    ctx.moveTo(landingScreen.sx, landingScreen.sy - 8);
    ctx.lineTo(landingScreen.sx, landingScreen.sy + 8);
    ctx.stroke();

    // Range badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    const rangeText = `Range: ${metrics.totalRange.toFixed(1)}m`;
    ctx.font = '11px "Fira Code", monospace';
    const rangeW = ctx.measureText(rangeText).width;
    ctx.fillRect(landingScreen.sx - rangeW / 2 - 6, landingScreen.sy + 10, rangeW + 12, 18);
    ctx.strokeRect(landingScreen.sx - rangeW / 2 - 6, landingScreen.sy + 10, rangeW + 12, 18);
    ctx.fillStyle = '#fca5a5';
    ctx.textAlign = 'center';
    ctx.fillText(rangeText, landingScreen.sx, landingScreen.sy + 23);
    ctx.restore();

    // 9. Target Objective (if active in Challenge Mode)
    if (target) {
      const tgtScreen = toScreen(target.x, target.y);
      const tgtRadiusPx = Math.max(12, target.radius * scale);
      ctx.save();
      // Target stand if in air
      if (target.y > 0) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tgtScreen.sx, tgtScreen.sy);
        ctx.lineTo(tgtScreen.sx, originY);
        ctx.stroke();
      }

      // Outer ring
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(tgtScreen.sx, tgtScreen.sy, tgtRadiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Middle ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tgtScreen.sx, tgtScreen.sy, tgtRadiusPx * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Inner ring
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(tgtScreen.sx, tgtScreen.sy, tgtRadiusPx * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Bullseye center
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(tgtScreen.sx, tgtScreen.sy, tgtRadiusPx * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Target Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Target (${target.x}m)`, tgtScreen.sx, tgtScreen.sy - tgtRadiusPx - 6);
      ctx.restore();
    }

    // 10. Launch Platform / Tower & Cannon
    const launchBaseScreen = toScreen(0, params.y0);

    // Platform tower if y0 > 0
    if (params.y0 > 0) {
      ctx.save();
      const towerGrad = ctx.createLinearGradient(
        originX - 16,
        launchBaseScreen.sy,
        originX + 16,
        originY
      );
      towerGrad.addColorStop(0, '#334155');
      towerGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = towerGrad;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;

      // Platform body
      ctx.fillRect(originX - 14, launchBaseScreen.sy, 28, originY - launchBaseScreen.sy);
      ctx.strokeRect(originX - 14, launchBaseScreen.sy, 28, originY - launchBaseScreen.sy);

      // Scaffolding cross-bars
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      for (let ty = launchBaseScreen.sy; ty < originY - 15; ty += 20) {
        ctx.beginPath();
        ctx.moveTo(originX - 14, ty);
        ctx.lineTo(originX + 14, ty + 20);
        ctx.moveTo(originX + 14, ty);
        ctx.lineTo(originX - 14, ty + 20);
        ctx.stroke();
      }

      // Height adjustment drag handle
      ctx.fillStyle = isDraggingHeight ? '#38bdf8' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(originX, launchBaseScreen.sy + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Cannon Turret
    ctx.save();
    const cannonRad = (params.angleDeg * Math.PI) / 180;
    const barrelLength = 32;
    const barrelWidth = 10;

    ctx.translate(launchBaseScreen.sx, launchBaseScreen.sy);

    // Cannon mount base / wheel
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotated barrel
    ctx.rotate(-cannonRad);

    const barrelGrad = ctx.createLinearGradient(0, -barrelWidth / 2, 0, barrelWidth / 2);
    barrelGrad.addColorStop(0, '#64748b');
    barrelGrad.addColorStop(0.5, '#cbd5e1');
    barrelGrad.addColorStop(1, '#334155');
    ctx.fillStyle = barrelGrad;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;

    // Cannon cylinder
    ctx.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth);
    ctx.strokeRect(0, -barrelWidth / 2, barrelLength, barrelWidth);

    // Muzzle cap
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(barrelLength - 2, -barrelWidth / 2 - 2, 4, barrelWidth + 4);

    // Interactive angle drag handle at barrel tip
    ctx.fillStyle = isDraggingAngle ? '#f59e0b' : '#38bdf8';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(barrelLength + 8, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Angle Arc Indicator
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(launchBaseScreen.sx, launchBaseScreen.sy, 40, 0, -cannonRad, true);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${params.angleDeg.toFixed(0)}°`,
      launchBaseScreen.sx + 45 * Math.cos(-cannonRad / 2),
      launchBaseScreen.sy + 45 * Math.sin(-cannonRad / 2)
    );
    ctx.restore();

    // 11. Current Projectile Position & Vectors
    const currentPt = sampleTrajectoryAtTime(points, currentTime);
    const currentScreen = toScreen(currentPt.x, currentPt.y);

    // Breadcrumb trail behind projectile
    ctx.save();
    ctx.fillStyle = params.enableDrag ? 'rgba(251, 113, 133, 0.4)' : 'rgba(56, 189, 248, 0.4)';
    for (let i = 0; i < points.length; i++) {
      if (points[i].t <= currentTime) {
        if (i % 6 === 0) {
          const tp = toScreen(points[i].x, points[i].y);
          ctx.beginPath();
          ctx.arc(tp.sx, tp.sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();

    // Projectile Body
    ctx.save();
    ctx.shadowColor = params.enableDrag ? '#f43f5e' : '#38bdf8';
    ctx.shadowBlur = 14;

    // Glowing core
    const ballGrad = ctx.createRadialGradient(
      currentScreen.sx - 2,
      currentScreen.sy - 2,
      1,
      currentScreen.sx,
      currentScreen.sy,
      8
    );
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.3, params.enableDrag ? '#f43f5e' : '#38bdf8');
    ballGrad.addColorStop(1, params.enableDrag ? '#9f1239' : '#0369a1');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(currentScreen.sx, currentScreen.sy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 12. Physics Vectors (Velocity, Components, Gravity)
    if (showVectors && currentPt.speed > 0.1) {
      ctx.save();
      const vectorScale = Math.min(1.5, Math.max(0.4, scale * 0.4)); // visual vector scale

      // Function to draw an arrow
      const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string, label: string) => {
        const headlen = 8;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.fill();

        ctx.font = '10px "Fira Code", monospace';
        ctx.fillText(label, toX + 6 * Math.cos(angle), toY + 6 * Math.sin(angle));
      };

      // 1. Total Velocity Vector (tangent, Cyan)
      const vEndX = currentScreen.sx + currentPt.vx * vectorScale;
      const vEndY = currentScreen.sy - currentPt.vy * vectorScale;
      drawArrow(currentScreen.sx, currentScreen.sy, vEndX, vEndY, '#06b6d4', `v=${currentPt.speed.toFixed(1)}`);

      // 2. Horizontal component vx (Emerald)
      const vxEndX = currentScreen.sx + currentPt.vx * vectorScale;
      drawArrow(currentScreen.sx, currentScreen.sy, vxEndX, currentScreen.sy, '#10b981', `vx=${currentPt.vx.toFixed(1)}`);

      // 3. Vertical component vy (Amber/Rose)
      const vyEndY = currentScreen.sy - currentPt.vy * vectorScale;
      drawArrow(currentScreen.sx, currentScreen.sy, currentScreen.sx, vyEndY, '#f59e0b', `vy=${currentPt.vy.toFixed(1)}`);

      // 4. Gravity Vector g (Violet, pointing straight down)
      const gLength = Math.min(45, params.gravity * 3.5);
      drawArrow(
        currentScreen.sx,
        currentScreen.sy,
        currentScreen.sx,
        currentScreen.sy + gLength,
        '#a855f7',
        `g=${params.gravity.toFixed(1)}`
      );

      ctx.restore();
    }

    ctx.restore();
  }, [
    points,
    vacuumPoints,
    metrics,
    params,
    ghostRuns,
    target,
    showVectors,
    showApexMarker,
    currentTime,
    planet,
    zoom,
    panOffset,
    isDraggingAngle,
    isDraggingHeight,
    getTransform,
  ]);

  // Canvas Mouse Interactions (Dragging Angle, Height, Pan)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const { originX, toScreen } = getTransform();
    const launchPos = toScreen(0, params.y0);

    // Check if clicked near cannon barrel tip
    const rad = (params.angleDeg * Math.PI) / 180;
    const tipX = launchPos.sx + 40 * Math.cos(-rad);
    const tipY = launchPos.sy + 40 * Math.sin(-rad);
    const distToTip = Math.hypot(mx - tipX, my - tipY);

    if (distToTip < 20) {
      setIsDraggingAngle(true);
      return;
    }

    // Check if clicked near platform height handle
    const distToHeight = Math.hypot(mx - originX, my - (launchPos.sy + 10));
    if (distToHeight < 20) {
      setIsDraggingHeight(true);
      return;
    }

    // Otherwise pan canvas
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDraggingAngle) {
      const { toScreen } = getTransform();
      const launchPos = toScreen(0, params.y0);
      const dx = mx - launchPos.sx;
      const dy = launchPos.sy - my; // invert Y
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      angle = Math.max(0, Math.min(90, Math.round(angle)));
      onParamsChange({ angleDeg: angle });
      return;
    }

    if (isDraggingHeight) {
      const { toWorld } = getTransform();
      const world = toWorld(mx, my);
      const newY0 = Math.max(0, Math.min(100, Math.round(world.wy)));
      onParamsChange({ y0: newY0 });
      return;
    }

    if (isDraggingCanvas) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingAngle(false);
    setIsDraggingHeight(false);
    setIsDraggingCanvas(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.max(0.4, Math.min(4.0, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full bg-slate-950 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden"
    >
      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Planet & Environment Badge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg text-xs font-medium text-slate-200">
          <span className="text-base">{planet.icon}</span>
          <span className="font-semibold text-cyan-300">{planet.name}</span>
          <span className="text-slate-400">|</span>
          <span className="font-mono text-slate-300">g = {params.gravity.toFixed(2)} m/s²</span>
          {params.enableDrag && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
              DRAG ON (ρ={params.airDensity.toFixed(2)})
            </span>
          )}
        </div>

        {/* View Controls & Toggles */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg text-xs">
          <button
            onClick={() => setShowVectors(!showVectors)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors font-medium ${
              showVectors
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle velocity and acceleration vector arrows"
          >
            <Sliders className="w-3.5 h-3.5" />
            Vectors
          </button>

          <button
            onClick={() => setShowApexMarker(!showApexMarker)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors font-medium ${
              showApexMarker
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle peak apex marker badge"
          >
            <Crosshair className="w-3.5 h-3.5" />
            Apex
          </button>

          <button
            onClick={onAddGhost}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors font-medium"
            title="Save current trajectory as ghost trace to compare variations"
          >
            <Layers className="w-3.5 h-3.5" />
            Snap Ghost ({ghostRuns.length})
          </button>

          {ghostRuns.length > 0 && (
            <button
              onClick={onClearGhosts}
              className="px-2 py-1 rounded-lg text-rose-400 hover:bg-rose-500/20 text-[11px] transition-colors"
              title="Clear all ghost trajectories"
            >
              Clear
            </button>
          )}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.min(4.0, z * 1.2))}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Hit Notification Banner */}
      {hasCelebratedHit && target && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/90 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 backdrop-blur-md animate-bounce">
          <Sparkles className="w-4 h-4" />
          BULLSEYE! Target Hit at {target.x}m!
        </div>
      )}

      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="flex-1 w-full h-[460px] cursor-grab active:cursor-grabbing touch-none select-none"
      />

      {/* Interactive Playback & Scrubber Footer Bar */}
      <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Play / Pause / Step Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentTime >= metrics.timeOfFlight) {
                setCurrentTime(0);
              }
              setIsPlaying(!isPlaying);
            }}
            className={`p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
            }`}
            title={isPlaying ? 'Pause' : 'Play Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reset to Launch (t = 0)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Step Back & Forward */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime((t) => Math.max(0, t - 0.05));
            }}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
            title="Step Back (-0.05s)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime((t) => Math.min(metrics.timeOfFlight, t + 0.05));
            }}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
            title="Step Forward (+0.05s)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-slate-700/60 text-xs">
            {[0.25, 0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2 py-1 rounded-lg transition-colors font-mono ${
                  playbackSpeed === s
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Time Timeline Scrubber */}
        <div className="flex-1 min-w-[200px] flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400 min-w-[48px]">
            {currentTime.toFixed(2)}s
          </span>

          <input
            type="range"
            min={0}
            max={metrics.timeOfFlight || 1}
            step={0.01}
            value={currentTime}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTime(parseFloat(e.target.value));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />

          <span className="font-mono text-xs text-slate-400 min-w-[48px] text-right">
            {metrics.timeOfFlight.toFixed(2)}s
          </span>
        </div>

        {/* Live instantaneous telemetry badge */}
        {(() => {
          const pt = sampleTrajectoryAtTime(points, currentTime);
          return (
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
              <div>
                <span className="text-slate-500">x: </span>
                <span className="text-cyan-400 font-semibold">{pt.x.toFixed(1)}m</span>
              </div>
              <div>
                <span className="text-slate-500">y: </span>
                <span className="text-amber-400 font-semibold">{pt.y.toFixed(1)}m</span>
              </div>
              <div>
                <span className="text-slate-500">v: </span>
                <span className="text-emerald-400 font-semibold">{pt.speed.toFixed(1)}m/s</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

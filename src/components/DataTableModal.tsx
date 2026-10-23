import React from 'react';
import { TrajectoryPoint, SimulationMetrics, SimulationParams } from '../types/physics';
import { X, Download, Copy, Check, Table, FileSpreadsheet } from 'lucide-react';

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: TrajectoryPoint[];
  metrics: SimulationMetrics;
  params: SimulationParams;
}

export const DataTableModal: React.FC<DataTableModalProps> = ({
  isOpen,
  onClose,
  points,
  metrics,
  params,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  // Generate CSV text
  const generateCSV = () => {
    const headers = ['time_s', 'x_m', 'y_m', 'vx_ms', 'vy_ms', 'speed_ms', 'ke_J', 'pe_J', 'totalE_J'];
    const rows = points.map((p) =>
      [
        p.t.toFixed(4),
        p.x.toFixed(4),
        p.y.toFixed(4),
        p.vx.toFixed(4),
        p.vy.toFixed(4),
        p.speed.toFixed(4),
        p.ke.toFixed(2),
        p.pe.toFixed(2),
        p.totalE.toFixed(2),
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `projectile_sim_v0_${params.v0}_deg_${params.angleDeg}_g_${params.gravity}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCSV = () => {
    const csvContent = generateCSV();
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sample every few rows for UI table preview
  const previewPoints = points.filter((_, idx) => idx % Math.max(1, Math.floor(points.length / 50)) === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Trajectory Numerical Dataset</h3>
              <p className="text-xs text-slate-400">
                {points.length} integration samples | v₀ = {params.v0} m/s, θ = {params.angleDeg}°, g = {params.gravity} m/s²
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy CSV'}
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50 sticky top-0">
                <th className="p-2.5">t (s)</th>
                <th className="p-2.5">x (m)</th>
                <th className="p-2.5">y (m)</th>
                <th className="p-2.5">vx (m/s)</th>
                <th className="p-2.5">vy (m/s)</th>
                <th className="p-2.5">|v| (m/s)</th>
                <th className="p-2.5">Ek (J)</th>
                <th className="p-2.5">Ep (J)</th>
                <th className="p-2.5">E_tot (J)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {previewPoints.map((pt, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="p-2 text-cyan-400">{pt.t.toFixed(3)}</td>
                  <td className="p-2">{pt.x.toFixed(2)}</td>
                  <td className="p-2 text-amber-300">{pt.y.toFixed(2)}</td>
                  <td className="p-2 text-slate-400">{pt.vx.toFixed(2)}</td>
                  <td className="p-2 text-slate-400">{pt.vy.toFixed(2)}</td>
                  <td className="p-2 font-semibold text-emerald-400">{pt.speed.toFixed(2)}</td>
                  <td className="p-2 text-slate-400">{pt.ke.toFixed(1)}</td>
                  <td className="p-2 text-slate-400">{pt.pe.toFixed(1)}</td>
                  <td className="p-2 font-semibold text-purple-400">{pt.totalE.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>Showing sampled preview of dataset ({previewPoints.length} of {points.length} points)</span>
          <span className="font-mono text-slate-500">Max range: {metrics.totalRange.toFixed(2)} m</span>
        </div>
      </div>
    </div>
  );
};

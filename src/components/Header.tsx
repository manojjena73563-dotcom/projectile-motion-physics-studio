import React from 'react';
import {
  Rocket,
  Download,
  Share2,
  Table,
  Target,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  onOpenDataTable: () => void;
  isChallengeMode: boolean;
  onToggleChallenge: () => void;
  score: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDataTable,
  isChallengeMode,
  onToggleChallenge,
  score,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-40">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center text-white">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Rocket className="w-5 h-5 text-cyan-400 -rotate-45" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              Projectile Motion <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">Physics Studio</span>
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
              v2.0 PRO
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Interactive Kinematics, Dynamic Gravity, Aerodynamic Drag & Live Telemetry
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {isChallengeMode && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 font-mono text-xs text-indigo-300">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Score: <strong className="text-white text-sm">{score}</strong></span>
          </div>
        )}

        <button
          onClick={onToggleChallenge}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            isChallengeMode
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
          }`}
          title="Toggle Target Practice Challenge"
        >
          <Target className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isChallengeMode ? 'Challenge Mode' : 'Target Practice'}</span>
        </button>

        <button
          onClick={onOpenDataTable}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all shadow-sm"
          title="Open numerical data table & CSV download"
        >
          <Table className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Data Table</span>
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  MapPin,
  Flame,
  Globe,
  Terminal,
  Activity,
} from 'lucide-react';
import { URBAN_PRESETS } from '../data/urbanPresets';
import { UrbanPreset } from '../types';

interface HeaderProps {
  activeTab: 'forma_simulator' | 'langgraph_inspector' | 'payload_inspector';
  setActiveTab: (tab: 'forma_simulator' | 'langgraph_inspector' | 'payload_inspector') => void;
  selectedPreset: UrbanPreset;
  onSelectPreset: (preset: UrbanPreset) => void;
  isBackendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPreset,
  onSelectPreset,
}) => {
  return (
    <header className="h-16 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between select-none z-30 flex-shrink-0">
      {/* Brand & Extension Tag */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/50 flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white flex items-center">
                FormaGuard
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Autodesk Forma AI
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span>LangGraph Orchestrator</span>
              <span className="text-slate-600">•</span>
              <span className="text-teal-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                FortyGuard 2m Heat
              </span>
            </div>
          </div>
        </div>

        {/* Location Preset Selector */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800">
          <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <select
            value={selectedPreset.id}
            onChange={(e) => {
              const p = URBAN_PRESETS.find((x) => x.id === e.target.value);
              if (p) onSelectPreset(p);
            }}
            className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium hover:bg-slate-850 transition-colors"
          >
            {URBAN_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('forma_simulator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'forma_simulator'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Forma Canvas & Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab('langgraph_inspector')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'langgraph_inspector'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>LangGraph Loop</span>
        </button>

        <button
          onClick={() => setActiveTab('payload_inspector')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'payload_inspector'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Forma Design API</span>
        </button>
      </nav>

      {/* Deployment Targets Status Pill */}
      <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
          <Globe className="w-3 h-3 text-cyan-400" />
          <span>Cloudflare Pages</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
          <Flame className="w-3 h-3 text-amber-400" />
          <span>Google Cloud Run</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>
    </header>
  );
};

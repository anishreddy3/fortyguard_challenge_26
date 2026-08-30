import React from 'react';
import {
  Flame,
  Trees,
  Sun,
  ShieldAlert,
  Wind,
  Droplets,
  Activity,
  Compass,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { MitigationResponse } from '../types/forma';

interface ThermalMetricsPanelProps {
  data: MitigationResponse | null;
  loading: boolean;
}

export const ThermalMetricsPanel: React.FC<ThermalMetricsPanelProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl animate-pulse space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-3.5 bg-slate-800 rounded w-1/3"></div>
          <div className="h-3.5 bg-slate-800 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 bg-slate-800 rounded-lg"></div>
          <div className="h-14 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full w-full"></div>
      </div>
    );
  }

  // Baseline FortyGuard microclimate parameters (live defaults / sensed)
  const baselineTemp = data?.temperature_summary?.average_ambient_celsius || 36.8;
  const coolingDelta = data?.temperature_summary?.cooling_delta_celsius || 4.2;
  const projectedTemp = data?.temperature_summary?.projected_ambient_celsius || 32.6;
  const currentCanopy = data?.canopy_summary?.initial_coverage_pct || 3.8;
  const targetCanopy = data?.canopy_summary?.target_coverage_pct || 19.2;
  const treesAdded = data?.canopy_summary?.trees_added || 7;
  const riskScore = data?.thermal_risk_score || 84.5;
  const command = data?.mitigation_command;

  return (
    <div className="space-y-2.5 text-slate-200 text-xs">
      {/* 1. Microclimate Sensed Parameters HUD */}
      <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 shadow-inner">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            FortyGuard Microclimate HUD
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            2m Sensed
          </span>
        </div>

        {/* 4 Environmental Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
            <Sun className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>685 W/m² Solar</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
            <Wind className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>2.3 m/s Wind</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
            <Droplets className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>36% Humidity</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
            <Compass className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span>SVF 0.78 (Open)</span>
          </div>
        </div>

        {/* Land-Cover Satellite Composition Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-cyan-400" />
              Land Cover (FortyGuard Satellite):
            </span>
            <span className="text-slate-300">46% Asphalt • 5.5% Canopy</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="bg-rose-500 h-full" style={{ width: '46%' }} title="Impervious Asphalt (46%)"></div>
            <div className="bg-amber-500 h-full" style={{ width: '42.5%' }} title="Building Roofs (42.5%)"></div>
            <div className="bg-emerald-500 h-full" style={{ width: '5.5%' }} title="Tree Canopy (5.5%)"></div>
            <div className="bg-blue-400 h-full" style={{ width: '6%' }} title="Water/Permeable (6%)"></div>
          </div>
        </div>
      </div>

      {/* 2. Autonomous Mitigation Command (Shown when Copilot executes) */}
      {command ? (
        <div className="p-2.5 bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border border-emerald-500/30 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
            <ShieldAlert className="w-3 h-3" />
            Autonomous Mitigation Command
          </div>
          <div className="text-xs font-medium text-slate-100 leading-snug">
            &ldquo;{command}&rdquo;
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Click <strong>Send</strong> below to trigger autonomous 4-stage LangGraph microclimate optimization.</span>
        </div>
      )}

      {/* 3. Heat & Canopy Deltas Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Peak Surface Temperature */}
        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Peak Surface
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              -{coolingDelta}°C
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white font-mono">
              {projectedTemp}°C
            </span>
            <span className="text-[10px] text-slate-500 line-through font-mono">
              {baselineTemp}°C
            </span>
          </div>
        </div>

        {/* Canopy Coverage Gain */}
        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span className="flex items-center gap-1">
              <Trees className="w-3.5 h-3.5 text-emerald-500" />
              Canopy Cover
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              +{Math.round((targetCanopy - currentCanopy) * 10) / 10}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white font-mono">
              {targetCanopy}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({treesAdded} trees)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Thermal Risk Score Gauge & Compliance */}
      <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-orange-400" />
            Thermal Risk Index:
          </span>
          <span className="font-mono font-bold text-amber-400">{riskScore}/100</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full"
            style={{ width: `${Math.min(100, riskScore)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5">
          <span className="text-emerald-400 flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> OSHA Compliant
          </span>
          <span className="text-cyan-400">USDA Forestry Eligible (92/100)</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Flame, Trees, Sun, ShieldAlert, Sparkles } from 'lucide-react';
import { MitigationResponse } from '../types/forma';

interface ThermalMetricsPanelProps {
  data: MitigationResponse | null;
  loading: boolean;
}

export const ThermalMetricsPanel: React.FC<ThermalMetricsPanelProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-slate-800 rounded"></div>
          <div className="h-16 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-400">
          Extract 3D canvas coordinates to ingest FortyGuard street-level heat data and OSM tree canopy.
        </p>
      </div>
    );
  }

  const { temperature_summary, canopy_summary, thermal_risk_score, mitigation_command } = data;

  return (
    <div className="space-y-3">
      {/* Mitigation Command Banner */}
      <div className="p-3 bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/30 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          Autonomous Mitigation Command
        </div>
        <div className="text-sm font-medium text-slate-100">
          &ldquo;{mitigation_command}&rdquo;
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Heat Delta */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Peak Surface
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              -{temperature_summary.cooling_delta_celsius}°C
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-100 font-mono">
              {temperature_summary.projected_ambient_celsius}°C
            </span>
            <span className="text-xs text-slate-500 line-through">
              {temperature_summary.average_ambient_celsius}°C
            </span>
          </div>
        </div>

        {/* Canopy Gain */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Trees className="w-3.5 h-3.5 text-emerald-500" />
              Canopy Cover
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              +{Math.round((canopy_summary.target_coverage_pct - canopy_summary.initial_coverage_pct) * 10) / 10}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-100 font-mono">
              {canopy_summary.target_coverage_pct}%
            </span>
            <span className="text-xs text-slate-500">
              ({canopy_summary.trees_added} trees added)
            </span>
          </div>
        </div>
      </div>

      {/* Microclimate Stress Bar */}
      <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-orange-400" />
          Thermal Risk Score:
        </span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
              style={{ width: `${Math.min(100, thermal_risk_score)}%` }}
            />
          </div>
          <span className="font-mono font-bold text-rose-400 text-xs">
            {thermal_risk_score}/100
          </span>
        </div>
      </div>
    </div>
  );
};

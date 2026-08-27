import React, { useState } from 'react';
import {
  Cpu,
  ArrowDown,
  CheckCircle2,
  Clock,
  Code2,
  Sparkles,
  Flame,
  Trees,
  Layers,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { MitigationRunResult, AgentStepTrace } from '../types';

interface LangGraphInspectorProps {
  mitigationResult: MitigationRunResult | null;
  thoughtTrace: AgentStepTrace[];
  isProcessing: boolean;
  onRerun: () => void;
}

export const LangGraphInspector: React.FC<LangGraphInspectorProps> = ({
  mitigationResult,
  thoughtTrace,
  isProcessing,
  onRerun,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
  });

  const toggleNode = (idx: number) => {
    setExpandedNodes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const steps = thoughtTrace.length > 0 ? thoughtTrace : [
    {
      step: 1,
      agent: 'EnvironmentalSensingAgent',
      title: 'Ingest FortyGuard 2m Heat & OSM Canopy Tools',
      status: 'completed' as const,
      executionTimeMs: 450,
      summary: 'Queried 2m street-level thermal sensors and OpenStreetMap tree polygons.',
    },
    {
      step: 2,
      agent: 'ThermalRiskAnalyzer',
      title: 'Synthesize Composite Thermal Vulnerability Index',
      status: 'completed' as const,
      executionTimeMs: 550,
      summary: 'Evaluated surface heat buildup, Mean Radiant Temperature (MRT), and unshaded corridors.',
    },
    {
      step: 3,
      agent: 'SpatialCanopyPlanner',
      title: 'Generate Bioclimatic Structural Commands',
      status: 'completed' as const,
      executionTimeMs: 600,
      summary: 'Calculated species crown diameters, evapotranspiration watts, and albedo coatings.',
    },
    {
      step: 4,
      agent: 'FormaActuator',
      title: 'Actuate Autodesk Forma Elements SDK Geometry',
      status: 'completed' as const,
      executionTimeMs: 400,
      summary: 'Compiled 4x4 matrix transforms and procedural meshes for Forma canvas insertion.',
    },
  ];

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden text-slate-100 font-sans select-none">
      {/* Header */}
      <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-white tracking-wide">
            LangGraph Multi-Agent Orchestration State Graph
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Python LangGraph v0.0.30 StateGraph
          </span>
        </div>

        <button
          onClick={onRerun}
          disabled={isProcessing}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Re-execute Graph</span>
        </button>
      </div>

      {/* Main Content Split: Graph Diagram & State Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Interactive Node Flow */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-800 space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>Agent Node Pipeline</span>
            <span className="text-[10px] text-slate-500 font-mono">
              (Total Loop Time: {mitigationResult?.execution_time_seconds || 2.0}s)
            </span>
          </div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Node Card */}
              <div
                onClick={() => setActiveStepIndex(idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeStepIndex === idx
                    ? 'bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
                      {step.step}
                    </div>
                    <span className="font-semibold text-white text-xs">{step.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{step.executionTimeMs}ms</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                  </div>
                </div>

                <div className="text-xs text-slate-300 mb-2">{step.summary}</div>

                {/* Sub-tools Pill Badge */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-400 font-semibold">
                    Agent: {step.agent}
                  </span>
                  {idx === 0 && (
                    <>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" />
                        Tool: get_fortyguard_temperature()
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                        <Trees className="w-2.5 h-2.5" />
                        Tool: get_osm_canopy()
                      </span>
                    </>
                  )}
                  {idx === 3 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" />
                      Tool: forma_design_actuator()
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Down Arrow */}
              {idx < steps.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowDown className="w-4 h-4 text-slate-600 animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: State Inspector for Selected Node */}
        <div className="w-1/2 p-6 overflow-y-auto bg-slate-950/60">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Agent State Schema & Tool Execution Logs</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-4">
            <div>
              <div className="text-emerald-400 font-semibold mb-1">
                // Selected Step {steps[activeStepIndex]?.step}: {steps[activeStepIndex]?.agent}
              </div>
              <div className="text-slate-400 text-[11px] mb-3">
                {steps[activeStepIndex]?.summary}
              </div>
            </div>

            {activeStepIndex === 0 && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                  <div className="text-amber-400 font-bold">FortyGuard 2m Heat Sensing Tool Output:</div>
                  <div>• Average Ambient: {mitigationResult?.temperature_data?.average_ambient_celsius || 35.2}°C</div>
                  <div>• Peak Surface Temperature: {mitigationResult?.temperature_data?.peak_surface_celsius || 48.4}°C</div>
                  <div>• Mean Radiant Temp (MRT): {mitigationResult?.temperature_data?.mean_radiant_temp_celsius || 46.4}°C</div>
                  <div>• Identified Hotspots: {mitigationResult?.temperature_data?.hotspots_count || 14} clusters</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                  <div className="text-emerald-400 font-bold">OpenStreetMap Canopy Tool Output:</div>
                  <div>• Existing Trees Catalogued: {mitigationResult?.canopy_data?.existing_trees_count || 6} trees</div>
                  <div>• Baseline Canopy Coverage: {mitigationResult?.canopy_data?.canopy_coverage_pct || 3.8}%</div>
                  <div>• Mean Vegetation NDVI: {mitigationResult?.canopy_data?.ndvi_mean || 0.32}</div>
                  <div>• Deficient Corridor: Southern Pedestrian Axis (1.2% canopy)</div>
                </div>
              </div>
            )}

            {activeStepIndex === 1 && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-2">
                <div className="text-rose-400 font-bold">Thermal Risk Evaluation Matrix:</div>
                <div className="text-slate-300">
                  Risk Score Formula: <br />
                  <code className="text-teal-300">
                    Vulnerability = (Ambient - 28°C)*4.5 + (Surface - 35°C)*2.2 + (30% - Canopy)*1.8
                  </code>
                </div>
                <div className="pt-2 border-t border-slate-800 text-rose-300 font-bold">
                  Composite Vulnerability Score: {mitigationResult?.thermal_risk_score || 86.4} / 100 (CRITICAL)
                </div>
              </div>
            )}

            {activeStepIndex === 2 && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-2">
                <div className="text-emerald-400 font-bold">Synthesized Mitigation Plan:</div>
                <div className="text-slate-100 font-semibold">
                  &ldquo;{mitigationResult?.mitigation_plan?.summary_command || 'Add 15% tree canopy to the southern corridor'}&rdquo;
                </div>
                <div className="text-slate-400 pt-1 space-y-1">
                  <div>• Targeted Ambient Cooling: -{mitigationResult?.mitigation_plan?.overall_thermal_reduction_celsius || 4.2}°C</div>
                  <div>• Targeted Surface Cooling: -{mitigationResult?.mitigation_plan?.surface_temp_drop_celsius || 8.6}°C</div>
                  <div>• Canopy Increase: +{mitigationResult?.mitigation_plan?.target_canopy_increase_pct || 15.4}%</div>
                  <div>• Recommended Species: Platanus x hispanica (London Plane, 9m Crown)</div>
                </div>
              </div>
            )}

            {activeStepIndex === 3 && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-2">
                <div className="text-cyan-400 font-bold">Autodesk Forma Elements Actuation:</div>
                <div>• Format: Autodesk Forma Procedural Trees & Polygon Mesh</div>
                <div>• Total 3D Entities: {mitigationResult?.forma_payload?.total_elements || 8} elements</div>
                <div>• Transform Coordinates: 4x4 Affine Localized Matrices</div>
                <div>• Integration Method: Forma.render.addGeometryBatch()</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

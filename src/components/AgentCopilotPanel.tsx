import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Layers,
  CheckCircle2,
  RefreshCw,
  Compass,
  ArrowRight,
  Flame,
  Trees,
  Sun,
  ShieldAlert,
  Cpu,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BoundingBox, MitigationRunResult } from '../types';

interface AgentCopilotPanelProps {
  currentBbox: BoundingBox;
  mitigationResult: MitigationRunResult | null;
  onRunMitigation: (prompt?: string) => Promise<void>;
  isProcessing: boolean;
  onCommitGeometry: () => void;
  geometryRendered: boolean;
}

export const AgentCopilotPanel: React.FC<AgentCopilotPanelProps> = ({
  currentBbox,
  mitigationResult,
  onRunMitigation,
  isProcessing,
  onCommitGeometry,
  geometryRendered,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: string;
      trace?: any[];
    }>
  >([
    {
      id: 'msg-1',
      role: 'system',
      content:
        'FormaGuard Copilot active. Connected to Autodesk Forma 3D canvas viewport & LangGraph agent backend.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = promptInput.trim() || 'Analyze thermal risk and generate autonomous cooling geometry for this Forma view';

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPromptInput('');

    try {
      await onRunMitigation(text);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'system',
          content: `Agent execution encountered an error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleCommit = () => {
    if (geometryRendered) return; // Prevent duplicate commits
    onCommitGeometry();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `commit-${Date.now()}`,
        role: 'system',
        content: `✅ Successfully committed ${
          mitigationResult?.forma_payload?.total_elements || 8
        } bioclimatic 3D assets to Autodesk Forma proposal!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="w-[360px] lg:w-[400px] h-full bg-slate-950 flex flex-col border-l border-slate-800 text-slate-100 font-sans z-20">
      {/* Extension Header */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                FormaGuard Copilot
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">
                  Active
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={() => onRunMitigation()}
            disabled={isProcessing}
            title="Refresh Analysis for Active Bounding Box"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* 3D Canvas Coordinates */}
        <div className="px-2.5 py-1.5 bg-slate-950/90 border border-slate-800 rounded-md text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-300">
            <Compass className="w-3 h-3 text-teal-400" />
            Forma BBox:
          </span>
          <span className="truncate max-w-[190px]">
            [{Math.round(currentBbox.min_x)}, {Math.round(currentBbox.min_y)}] → [
            {Math.round(currentBbox.max_x)}, {Math.round(currentBbox.max_y)}]
          </span>
        </div>
      </div>

      {/* Microclimate Thermal Status Card */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/40 space-y-2.5">
        {mitigationResult ? (
          <div className="space-y-2">
            {/* Mitigation Command Pill */}
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                <ShieldAlert className="w-3 h-3" />
                Structural Mitigation Plan
              </div>
              <div className="text-xs font-medium text-slate-100 leading-snug">
                &ldquo;{mitigationResult.mitigation_command}&rdquo;
              </div>
            </div>

            {/* Metrics 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" />
                    Ambient Temp
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    -{mitigationResult.mitigation_plan.overall_thermal_reduction_celsius}°C
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-slate-100 font-mono">
                    {Math.round(
                      (mitigationResult.temperature_data.average_ambient_celsius -
                        mitigationResult.mitigation_plan.overall_thermal_reduction_celsius) *
                        10
                    ) / 10}
                    °C
                  </span>
                  <span className="text-[10px] text-slate-500 line-through">
                    {mitigationResult.temperature_data.average_ambient_celsius}°C
                  </span>
                </div>
              </div>

              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Trees className="w-3 h-3 text-emerald-500" />
                    Canopy Cover
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    +{mitigationResult.mitigation_plan.target_canopy_increase_pct}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-slate-100 font-mono">
                    {Math.round(
                      (mitigationResult.canopy_data.canopy_coverage_pct +
                        mitigationResult.mitigation_plan.target_canopy_increase_pct) *
                        10
                    ) / 10}
                    %
                  </span>
                  <span className="text-[10px] text-slate-500">
                    (+{mitigationResult.forma_payload.spatial_distribution_summary.canopy_trees_added} trees)
                  </span>
                </div>
              </div>
            </div>

            {/* FortyGuard Satellite Land-Cover & Exceedance Indicators */}
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-300">FortyGuard Satellite Land-Cover:</span>
                <span className="text-amber-400 font-mono">88.5% Impervious</span>
              </div>
              {/* Stacked bar */}
              <div className="w-full h-2 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
                <div className="h-full bg-slate-500" style={{ width: '46%' }} title="Asphalt / Pavement (46%)"></div>
                <div className="h-full bg-slate-400" style={{ width: '42.5%' }} title="Building Roofs (42.5%)"></div>
                <div className="h-full bg-emerald-500" style={{ width: '5.5%' }} title="Tree Canopy (5.5%)"></div>
                <div className="h-full bg-emerald-400" style={{ width: '6%' }} title="Turf / Grass (6%)"></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>46% Road</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>42.5% Roof</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>5.5% Tree</span>
              </div>
            </div>

            {/* Thermal Stress & Regulatory Compliance */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">Vulnerability Score:</span>
                <span className="font-mono font-bold text-rose-400 text-xs">
                  {mitigationResult.thermal_risk_score}/100 (CRITICAL)
                </span>
              </div>
              <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">Heat Exceedance (&gt;35°C):</span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  6.8h &rarr; 1.4h/day
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-center">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-400">
              Ready to analyze 3D canvas microclimate thermal risk.
            </p>
          </div>
        )}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'items-end'
                : msg.role === 'assistant'
                ? 'items-start'
                : 'items-center text-center'
            }`}
          >
            {msg.role === 'system' ? (
              <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400 text-[11px] max-w-[90%]">
                {msg.content}
              </div>
            ) : (
              <div
                className={`max-w-[90%] rounded-xl p-3 ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 mb-1.5 uppercase tracking-wider">
                    <Cpu className="w-3 h-3" />
                    LangGraph Multi-Agent
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            )}
            <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {/* Live Assistant Response if available */}
        {mitigationResult && (
          <div className="flex flex-col items-start text-xs">
            <div className="max-w-[95%] rounded-xl p-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                <Cpu className="w-3 h-3" />
                LangGraph Decision Output
              </div>
              <div className="font-semibold text-slate-100 text-xs">
                {mitigationResult.mitigation_command}
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>• Surface Cooling: -{mitigationResult.mitigation_plan.surface_temp_drop_celsius}°C</div>
                <div>• Canopy Expansion: +{mitigationResult.mitigation_plan.target_canopy_increase_pct}%</div>
                <div>• Forma 3D Assets: {mitigationResult.forma_payload.total_elements} entities prepared</div>
              </div>
            </div>
            <span className="text-[9px] text-slate-500 mt-1 px-1">Just now</span>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Multi-Agent LangGraph evaluating FortyGuard heat layers...</span>
          </div>
        )}
      </div>

      {/* Forma Canvas Actuator Action Bar */}
      {mitigationResult && (
        <div className="p-3 bg-slate-900/95 border-t border-slate-800">
          <button
            onClick={handleCommit}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all ${
              geometryRendered
                ? 'bg-emerald-700 text-white'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white'
            }`}
          >
            {geometryRendered ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Geometry Rendered on Forma Canvas ({mitigationResult.forma_payload.total_elements} Assets)
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                Render Mitigation Geometry onto Forma Canvas ({mitigationResult.forma_payload.total_elements} Assets)
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Ask Copilot or type 'Add 20% tree canopy'..."
          disabled={isProcessing}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          disabled={isProcessing}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

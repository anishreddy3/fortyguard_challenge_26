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
  Cpu,
} from 'lucide-react';
import { FormaBoundingBox, MitigationResponse } from '../types/forma';
import { triggerAgentMitigation } from '../services/backendApi';
import { commitGeometryToForma } from '../services/formaSdk';
import { ThermalMetricsPanel } from './ThermalMetricsPanel';

interface AgentCopilotProps {
  currentBbox: FormaBoundingBox;
  onRefreshBbox: () => Promise<void>;
  onGeometryCommitted?: (response: MitigationResponse) => void;
}

export const AgentCopilot: React.FC<AgentCopilotProps> = ({
  currentBbox,
  onRefreshBbox,
  onGeometryCommitted,
}) => {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: string;
      mitigationData?: MitigationResponse;
    }>
  >([
    {
      id: 'init-1',
      role: 'system',
      content:
        'FormaGuard Agent Copilot initialized. Extracting active 3D canvas coordinates to evaluate microclimate heat risk.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMitigation, setActiveMitigation] = useState<MitigationResponse | null>(null);
  const [committing, setCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText =
      inputPrompt.trim() ||
      'Perform autonomous thermal risk assessment and generate mitigation geometry for Forma canvas';

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: 'user' as const,
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);
    setCommitSuccess(false);

    try {
      // Trigger Python FastAPI LangGraph multi-agent loop
      const result = await triggerAgentMitigation(currentBbox, promptText);
      setActiveMitigation(result);

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: result.final_response || result.mitigation_command,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mitigationData: result,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'system' as const,
        content: `Error executing LangGraph agent loop: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitToForma = async () => {
    if (!activeMitigation?.forma_geometry_payload) return;
    setCommitting(true);

    try {
      const commitRes = await commitGeometryToForma(activeMitigation.forma_geometry_payload);
      setCommitSuccess(true);
      if (onGeometryCommitted) {
        onGeometryCommitted(activeMitigation);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `commit-${Date.now()}`,
          role: 'system',
          content: `✅ ${commitRes.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `commit-err-${Date.now()}`,
          role: 'system',
          content: `❌ Commit failed: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans border-r border-slate-800">
      {/* Header / Forma Coordinates Extractor */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                FormaGuard Copilot
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                  v1.0
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onRefreshBbox}
            title="Re-extract 3D Bounding Box from Forma Canvas"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BBox Tag */}
        <div className="px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-md text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-300">
            <Compass className="w-3 h-3 text-teal-400" />
            Forma BBox:
          </span>
          <span className="truncate max-w-[200px]">
            [{Math.round(currentBbox.min_x)}, {Math.round(currentBbox.min_y)}] → [
            {Math.round(currentBbox.max_x)}, {Math.round(currentBbox.max_y)}]
          </span>
        </div>
      </div>

      {/* Main Thermal Status & Metrics */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/40">
        <ThermalMetricsPanel data={activeMitigation} loading={loading} />
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
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
                    LangGraph Orchestrator
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Show Thought Trace if Available */}
                {msg.mitigationData?.agent_thought_trace && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Agent Execution Trace:
                    </div>
                    {msg.mitigationData.agent_thought_trace.map((step, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] font-mono text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/60"
                      >
                        <span className="text-teal-400 font-semibold">{step.agent}:</span> {step.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>LangGraph agents querying FortyGuard & OpenStreetMap...</span>
          </div>
        )}
      </div>

      {/* Actuator Action Bar (Render onto Forma Canvas) */}
      {activeMitigation?.forma_geometry_payload && (
        <div className="p-3 bg-slate-900/90 border-t border-slate-800">
          <button
            onClick={handleCommitToForma}
            disabled={committing}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all ${
              commitSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white'
            }`}
          >
            {committing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Pushing Geometry to Autodesk Forma Canvas...
              </>
            ) : commitSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Geometry Rendered on Forma Canvas ({activeMitigation.forma_geometry_payload.total_elements} assets)
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                Render Mitigation Geometry to Forma Canvas ({activeMitigation.forma_geometry_payload.total_elements} Assets)
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask Copilot or click send for autonomous heat mitigation..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

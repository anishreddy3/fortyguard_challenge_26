/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FormaCanvasViewport } from './components/FormaCanvasViewport';
import { AgentCopilotPanel } from './components/AgentCopilotPanel';
import { LangGraphInspector } from './components/LangGraphInspector';
import { PayloadInspector } from './components/PayloadInspector';
import { URBAN_PRESETS } from './data/urbanPresets';
import { UrbanPreset, MitigationRunResult, AgentStepTrace } from './types';
import { runLangGraphOrchestrator } from './services/agentEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'forma_simulator' | 'langgraph_inspector' | 'payload_inspector'
  >('forma_simulator');

  const [selectedPreset, setSelectedPreset] = useState<UrbanPreset>(URBAN_PRESETS[0]);
  const [mitigationResult, setMitigationResult] = useState<MitigationRunResult | null>(null);
  const [thoughtTrace, setThoughtTrace] = useState<AgentStepTrace[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showThermalHeatmap, setShowThermalHeatmap] = useState<boolean>(true);
  const [showOsmCanopy, setShowOsmCanopy] = useState<boolean>(true);
  const [geometryRendered, setGeometryRendered] = useState<boolean>(false);

  // Auto-run initial evaluation when preset changes
  const executeMitigation = async (customPrompt?: string) => {
    setIsProcessing(true);
    setGeometryRendered(false);

    try {
      const result = await runLangGraphOrchestrator(
        selectedPreset.bbox,
        customPrompt,
        (steps) => {
          setThoughtTrace(steps);
        }
      );
      setMitigationResult(result);
    } catch (error) {
      console.error('[FormaGuard] LangGraph execution error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Initial run on load
    executeMitigation();
  }, [selectedPreset]);

  const handleSelectPreset = (preset: UrbanPreset) => {
    setSelectedPreset(preset);
    setMitigationResult(null);
    setGeometryRendered(false);
  };

  const handleCommitGeometry = () => {
    setGeometryRendered(true);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Tab Panels */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'forma_simulator' && (
          <div className="flex-1 flex w-full h-full overflow-hidden">
            {/* Left/Center: Autodesk Forma 3D Canvas Viewport */}
            <FormaCanvasViewport
              preset={selectedPreset}
              mitigationResult={mitigationResult}
              showThermalHeatmap={showThermalHeatmap}
              setShowThermalHeatmap={setShowThermalHeatmap}
              showOsmCanopy={showOsmCanopy}
              setShowOsmCanopy={setShowOsmCanopy}
              geometryRenderedOnCanvas={geometryRendered}
              onTriggerMitigation={() => executeMitigation()}
              isProcessing={isProcessing}
            />

            {/* Right: FormaGuard Copilot Extension Panel */}
            <AgentCopilotPanel
              currentBbox={selectedPreset.bbox}
              mitigationResult={mitigationResult}
              onRunMitigation={executeMitigation}
              isProcessing={isProcessing}
              onCommitGeometry={handleCommitGeometry}
              geometryRendered={geometryRendered}
            />
          </div>
        )}

        {activeTab === 'langgraph_inspector' && (
          <LangGraphInspector
            mitigationResult={mitigationResult}
            thoughtTrace={thoughtTrace}
            isProcessing={isProcessing}
            onRerun={() => executeMitigation()}
          />
        )}

        {activeTab === 'payload_inspector' && (
          <PayloadInspector mitigationResult={mitigationResult} />
        )}
      </main>
    </div>
  );
}

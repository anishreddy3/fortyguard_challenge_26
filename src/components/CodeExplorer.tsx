import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Copy,
  Check,
  Globe,
  Flame,
  Terminal,
  Activity,
  Sparkles,
} from 'lucide-react';

interface FileTreeItem {
  id: string;
  name: string;
  path: string;
  directory: 'fortyguard' | 'agent_backend' | 'forma_extension' | 'src';
  language: string;
  content: string;
}

export const CodeExplorer: React.FC = () => {
  const [selectedDir, setSelectedDir] = useState<'all' | 'fortyguard' | 'agent_backend' | 'forma_extension' | 'src'>('all');
  const [copied, setCopied] = useState(false);

  const files: FileTreeItem[] = [
    // FortyGuard SDK Client
    {
      id: 'fortyguard_client',
      name: 'client.py',
      path: '/fortyguard/client.py',
      directory: 'fortyguard',
      language: 'python',
      content: `"""Python client for the FortyGuard tOS Enterprise API.

One method per endpoint. All analysis endpoints are async task-based —
the \`_submit_and_wait\` helper handles polling so callers don't have to.
"""

from __future__ import annotations
import os, time, requests
from typing import Any, Iterable

DEFAULT_BASE_URL = "https://api.fortyguard.com"

class FortyGuardClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None, timeout: float = 60.0):
        self.api_key = api_key or os.getenv("FORTYGUARD_API_KEY")
        self.base_url = (base_url or os.getenv("FORTYGUARD_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self._session = requests.Session()
        self._session.headers.update({"api-key": self.api_key, "Content-Type": "application/json"})

    def create_heatmap(self, polygon_aoi: dict, start_date: str, start_time: str, filter_type: int = 1, granularity: int = 100, wait: bool = True):
        """Submit a 2m street-level microclimate heatmap task and poll status until complete."""
        payload = {"polygon_aoi": polygon_aoi, "start_date": start_date, "start_time": start_time, "filter_type": filter_type, "granularity": granularity}
        return self._submit_and_wait("/v1/heatmap", payload) if wait else self._submit("/v1/heatmap", payload)`,
    },
    // Agent Backend files
    {
      id: 'backend_main',
      name: 'main.py',
      path: '/agent_backend/main.py',
      directory: 'agent_backend',
      language: 'python',
      content: `from typing import Dict, Any, Optional
import time
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from agent_backend.config import settings
from agent_backend.state import BoundingBox, AgentState
from agent_backend.tools import get_fortyguard_temperature, get_osm_canopy, forma_design_actuator
from agent_backend.graph import orchestrator

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous heat-mitigation LangGraph agent backend for Autodesk Forma extensions."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MitigateRequest(BaseModel):
    bounding_box: BoundingBox
    user_prompt: Optional[str] = "Perform autonomous thermal risk assessment and generate mitigation geometry for Forma canvas"
    target_reduction_celsius: Optional[float] = 3.0

@app.post("/api/mitigate")
async def run_mitigation_pipeline(payload: MitigateRequest):
    initial_state: AgentState = {
        "messages": [],
        "bounding_box": payload.bounding_box.dict(),
        "user_prompt": payload.user_prompt,
        "active_agent": "Starting",
        "iteration": 0
    }
    final_state = orchestrator.run(initial_state)
    return JSONResponse(status_code=status.HTTP_200_OK, content={
        "status": "success",
        "bounding_box": payload.bounding_box.dict(),
        "thermal_risk_score": final_state.get("thermal_risk_score"),
        "mitigation_command": final_state.get("mitigation_plan", {}).get("summary_command"),
        "mitigation_plan": final_state.get("mitigation_plan"),
        "forma_geometry_payload": final_state.get("forma_payload"),
        "agent_thought_trace": final_state.get("messages", []),
        "final_response": final_state.get("final_response")
    })`,
    },
    {
      id: 'backend_graph',
      name: 'graph.py',
      path: '/agent_backend/graph.py',
      directory: 'agent_backend',
      language: 'python',
      content: `from typing import Dict, Any, List
from agent_backend.state import AgentState
from agent_backend.tools import get_fortyguard_temperature, get_osm_canopy, forma_design_actuator

# Node 1: Environmental Sensing
def sense_environment_node(state: AgentState) -> Dict[str, Any]:
    bbox = state.get("bounding_box", {})
    temp_data = get_fortyguard_temperature(bbox)
    canopy_data = get_osm_canopy(bbox)
    return {"temperature_data": temp_data, "canopy_data": canopy_data, "active_agent": "ThermalRiskAnalyzer"}

# Node 2: Thermal Vulnerability Assessment
def thermal_risk_analyzer_node(state: AgentState) -> Dict[str, Any]:
    temp_data = state.get("temperature_data", {})
    avg_temp = temp_data.get("average_ambient_celsius", 35.0)
    risk_score = round(min(100.0, (avg_temp - 28.0) * 4.5 + 40.0), 1)
    return {"thermal_risk_score": risk_score, "active_agent": "SpatialCanopyPlanner"}

# Node 3: Spatial Bioclimatic Planner
def spatial_canopy_planner_node(state: AgentState) -> Dict[str, Any]:
    summary_command = "Add 15% tree canopy to the southern corridor and deploy cool pavement coating to central plaza"
    return {"mitigation_plan": {"summary_command": summary_command, "overall_thermal_reduction_celsius": 4.2}, "active_agent": "FormaActuator"}

# Node 4: Autodesk Forma Elements Actuator
def forma_actuator_node(state: AgentState) -> Dict[str, Any]:
    plan = state.get("mitigation_plan", {})
    forma_payload = forma_design_actuator(plan)
    return {"forma_payload": forma_payload, "active_agent": "Completed"}`,
    },
    {
      id: 'backend_tools',
      name: 'tools.py',
      path: '/agent_backend/tools.py',
      directory: 'agent_backend',
      language: 'python',
      content: `import math, random, uuid
from typing import Dict, Any, List
from agent_backend.config import settings

def get_fortyguard_temperature(bbox: Dict[str, Any]) -> Dict[str, Any]:
    """Senses 2-meter resolution microclimate temperature via live FortyGuard API or high-res model."""
    if settings.FORTYGUARD_API_KEY:
        from fortyguard import FortyGuardClient
        client = FortyGuardClient(api_key=settings.FORTYGUARD_API_KEY)
        # Live async query with polling ...
    return {
        "status": "success",
        "provider": "FortyGuard tOS Microclimate API",
        "average_ambient_celsius": 35.2,
        "peak_surface_celsius": 48.4,
        "thermal_stress_level": "High"
    }

def forma_design_actuator(mitigation_plan: Dict[str, Any]) -> Dict[str, Any]:
    """Translates AI cooling strategy into Autodesk Forma Elements SDK payload with 4x4 matrices."""
    return {
        "status": "ready_to_commit",
        "forma_api_version": "v1.2-beta",
        "action": "Forma.render.addGeometryBatch",
        "total_elements": 9,
        "elements": [...]
    }`,
    },
    // Forma Extension files
    {
      id: 'forma_sdk_service',
      name: 'formaSdk.ts',
      path: '/forma_extension/src/services/formaSdk.ts',
      directory: 'forma_extension',
      language: 'typescript',
      content: `import { FormaBoundingBox, FormaActuatorPayload } from '../types/forma';

export async function getFormaCanvasBoundingBox(): Promise<FormaBoundingBox> {
  if (typeof (window as any).Forma !== 'undefined' && (window as any).Forma.geometry) {
    const forma = (window as any).Forma;
    const selection = await forma.selection.getSelection();
    if (selection && selection.length > 0) {
      const bbox = await forma.geometry.getBbox({ paths: selection });
      return { min_x: bbox.min.x, min_y: bbox.min.y, max_x: bbox.max.x, max_y: bbox.max.y, crs: 'EPSG:3857' };
    }
  }
  return { min_x: 394200.0, min_y: 3701400.0, max_x: 394550.0, max_y: 3701750.0, crs: 'EPSG:32612' };
}

export async function commitGeometryToForma(payload: FormaActuatorPayload) {
  if (typeof (window as any).Forma !== 'undefined' && (window as any).Forma.render) {
    const forma = (window as any).Forma;
    await forma.render.addGeometryBatch({ geometries: payload.elements });
    if (forma.proposal?.notifyUpdate) await forma.proposal.notifyUpdate();
  }
}`,
    },
    {
      id: 'forma_copilot_component',
      name: 'AgentCopilot.tsx',
      path: '/forma_extension/src/components/AgentCopilot.tsx',
      directory: 'forma_extension',
      language: 'typescript',
      content: `import React, { useState } from 'react';
import { triggerAgentMitigation } from '../services/backendApi';
import { commitGeometryToForma } from '../services/formaSdk';

export const AgentCopilot = ({ currentBbox, onRefreshBbox }: any) => {
  const [loading, setLoading] = useState(false);
  const [mitigation, setMitigation] = useState<any>(null);

  const handleMitigate = async (prompt?: string) => {
    setLoading(true);
    const result = await triggerAgentMitigation(currentBbox, prompt);
    setMitigation(result);
    setLoading(false);
  };

  const handleCommit = async () => {
    if (mitigation?.forma_geometry_payload) {
      await commitGeometryToForma(mitigation.forma_geometry_payload);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4">
      {/* Extension Copilot View */}
    </div>
  );
};`,
    },
  ];

  const [selectedFile, setSelectedFile] = useState<FileTreeItem>(files[0]);

  const filteredFiles =
    selectedDir === 'all' ? files : files.filter((f) => f.directory === selectedDir);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden text-slate-100 font-sans select-none">
      {/* Top Ribbon */}
      <div className="h-14 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-amber-400" />
            Project File Architecture & Live Integrations
          </span>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedDir('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                selectedDir === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Files
            </button>
            <button
              onClick={() => setSelectedDir('fortyguard')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                selectedDir === 'fortyguard'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>/fortyguard (SDK Client)</span>
            </button>
            <button
              onClick={() => setSelectedDir('agent_backend')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                selectedDir === 'agent_backend'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>/agent_backend (FastAPI + LangGraph)</span>
            </button>
            <button
              onClick={() => setSelectedDir('forma_extension')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                selectedDir === 'forma_extension'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>/forma_extension (Autodesk SDK)</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy File Content'}</span>
        </button>
      </div>

      {/* Main Split Body: File Tree + Code Display */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Explorer */}
        <div className="w-72 bg-slate-950 border-r border-slate-800 p-3 overflow-y-auto space-y-1 flex-shrink-0">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
            Project Files ({filteredFiles.length})
          </div>

          {filteredFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-all ${
                selectedFile.id === file.id
                  ? 'bg-slate-800 text-white font-medium border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode
                  className={`w-4 h-4 flex-shrink-0 ${
                    file.directory === 'fortyguard'
                      ? 'text-emerald-400'
                      : file.directory === 'agent_backend'
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}
                />
                <span className="truncate">{file.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                {file.directory === 'fortyguard' ? 'SDK' : file.directory === 'agent_backend' ? 'Python' : 'TypeScript'}
              </span>
            </button>
          ))}
        </div>

        {/* Right Code Display */}
        <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden">
          <div className="h-9 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 flex-shrink-0">
            <span className="text-emerald-400 font-medium">{selectedFile.path}</span>
            <span>Language: {selectedFile.language}</span>
          </div>

          <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300">
            <pre className="leading-relaxed whitespace-pre font-mono">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

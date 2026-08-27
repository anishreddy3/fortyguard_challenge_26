import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Flame,
  Trees,
  Box,
  Sun,
  Activity,
  Building2,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { MitigationRunResult } from '../types';

interface PayloadInspectorProps {
  mitigationResult: MitigationRunResult | null;
}

export const PayloadInspector: React.FC<PayloadInspectorProps> = ({ mitigationResult }) => {
  const [activeTab, setActiveTab] = useState<
    'forma_elements' | 'fortyguard_heatmap' | 'fortyguard_env' | 'fortyguard_satellite' | 'fortyguard_intel' | 'osm'
  >('forma_elements');
  const [copied, setCopied] = useState(false);

  const formaPayload = mitigationResult?.forma_payload;
  const tempPayload = mitigationResult?.temperature_data;
  const canopyPayload = mitigationResult?.canopy_data;

  const getActivePayloadJson = () => {
    switch (activeTab) {
      case 'forma_elements':
        return formaPayload ? JSON.stringify(formaPayload, null, 2) : '// No active Forma geometry batch compiled yet.';
      case 'fortyguard_heatmap':
        return tempPayload
          ? JSON.stringify(
              {
                endpoint: 'POST /v1/heatmap',
                provider: tempPayload.provider,
                bounding_box: tempPayload.bounding_box,
                analytic_type: 'tcm + exceedance (>35C)',
                average_ambient_celsius: tempPayload.average_ambient_celsius,
                peak_surface_celsius: tempPayload.peak_surface_celsius,
                mean_exceedance_hours_daily: tempPayload.mean_exceedance_hours_daily,
                max_persistence_hours: tempPayload.max_persistence_hours,
                hotspots_count: tempPayload.hotspots_count,
                heat_points_sample: tempPayload.heat_points.slice(0, 8),
              },
              null,
              2
            )
          : '// Awaiting FortyGuard 2m Heatmap query.';
      case 'fortyguard_env':
        return tempPayload?.environmental_params
          ? JSON.stringify(
              {
                endpoint: 'POST /v1/env_params',
                parameters: tempPayload.environmental_params,
                description: 'Hyperlocal microclimate time series and physical atmosphere metrics.',
              },
              null,
              2
            )
          : '// Awaiting FortyGuard Environmental Parameters.';
      case 'fortyguard_satellite':
        return tempPayload?.satellite_segmentation
          ? JSON.stringify(
              {
                endpoint: 'POST /v1/satellite',
                segmentation_fractions: tempPayload.satellite_segmentation,
                impervious_surface_total_pct:
                  tempPayload.satellite_segmentation.building_pct + tempPayload.satellite_segmentation.asphalt_road_pct,
                vegetation_total_pct:
                  tempPayload.satellite_segmentation.tree_canopy_pct + tempPayload.satellite_segmentation.grass_vegetation_pct,
              },
              null,
              2
            )
          : '// Awaiting FortyGuard Satellite Segmentation.';
      case 'fortyguard_intel':
        return tempPayload?.heat_intelligence
          ? JSON.stringify(
              {
                endpoint: 'POST /v1/heat_intelligence',
                compliance_and_grants: tempPayload.heat_intelligence,
                standards_evaluated: ['ASHRAE Standard 55', 'OSHA Outdoor Heat Illness Rule', 'EPA Urban Heat Island Reduction', 'USDA Forest Service IRA'],
              },
              null,
              2
            )
          : '// Awaiting FortyGuard Heat Intelligence Report.';
      case 'osm':
        return canopyPayload ? JSON.stringify(canopyPayload, null, 2) : '// Awaiting OpenStreetMap Canopy query.';
      default:
        return '{}';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActivePayloadJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden text-slate-100 font-sans select-none">
      {/* Ribbon Header */}
      <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            FortyGuard & Autodesk Forma API Telemetry Explorer
          </span>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('forma_elements')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                activeTab === 'forma_elements'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>Forma Elements (3D Geometry)</span>
            </button>

            <button
              onClick={() => setActiveTab('fortyguard_heatmap')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                activeTab === 'fortyguard_heatmap'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>/v1/heatmap (2m + Exceedance)</span>
            </button>

            <button
              onClick={() => setActiveTab('fortyguard_env')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                activeTab === 'fortyguard_env'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-300" />
              <span>/v1/env_params</span>
            </button>

            <button
              onClick={() => setActiveTab('fortyguard_satellite')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                activeTab === 'fortyguard_satellite'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3 h-3 text-cyan-400" />
              <span>/v1/satellite</span>
            </button>

            <button
              onClick={() => setActiveTab('fortyguard_intel')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                activeTab === 'fortyguard_intel'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-3 h-3 text-emerald-400" />
              <span>/v1/heat_intelligence</span>
            </button>

            <button
              onClick={() => setActiveTab('osm')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                activeTab === 'osm'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trees className="w-3 h-3 text-emerald-400" />
              <span>OSM Canopy</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Raw JSON'}</span>
        </button>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 p-6 overflow-auto bg-slate-900/40">
        <pre className="font-mono text-xs text-emerald-300 leading-relaxed max-w-5xl mx-auto p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-x-auto">
          <code>{getActivePayloadJson()}</code>
        </pre>
      </div>
    </div>
  );
};

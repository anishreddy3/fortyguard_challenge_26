import React, { useState } from 'react';
import {
  Flame,
  Trees,
  Compass,
  Sun,
  Wind,
  Droplets,
  Activity,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { UrbanPreset, MitigationRunResult } from '../types';

interface FormaCanvasViewportProps {
  preset: UrbanPreset;
  mitigationResult: MitigationRunResult | null;
  showThermalHeatmap: boolean;
  setShowThermalHeatmap: (val: boolean) => void;
  showOsmCanopy: boolean;
  setShowOsmCanopy: (val: boolean) => void;
  geometryRenderedOnCanvas: boolean;
  onTriggerMitigation: () => void;
  isProcessing: boolean;
}

export const FormaCanvasViewport: React.FC<FormaCanvasViewportProps> = ({
  preset,
  mitigationResult,
  showThermalHeatmap,
  setShowThermalHeatmap,
  showOsmCanopy,
  setShowOsmCanopy,
  geometryRenderedOnCanvas,
}) => {
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [heatmapMode, setHeatmapMode] = useState<'temperature' | 'exceedance' | 'satellite'>('temperature');
  const [selectedElement, setSelectedElement] = useState<any | null>(null);

  // Color mapper for 2m temperature
  const getTempColor = (celsius: number) => {
    if (celsius >= 46) return 'rgba(239, 68, 68, 0.75)'; // Red
    if (celsius >= 42) return 'rgba(249, 115, 22, 0.7)'; // Orange
    if (celsius >= 38) return 'rgba(245, 158, 11, 0.65)'; // Amber
    if (celsius >= 34) return 'rgba(234, 179, 8, 0.55)'; // Yellow
    return 'rgba(16, 185, 129, 0.45)'; // Green cool
  };

  // Color mapper for exceedance hours (>35°C)
  const getExceedanceColor = (hours: number) => {
    if (hours >= 7) return 'rgba(220, 38, 38, 0.8)';
    if (hours >= 5) return 'rgba(234, 88, 12, 0.75)';
    if (hours >= 3) return 'rgba(217, 119, 6, 0.65)';
    return 'rgba(13, 148, 136, 0.45)';
  };

  const currentHeatPoints = mitigationResult?.temperature_data?.heat_points || [];
  const envParams = mitigationResult?.temperature_data?.environmental_params;
  const streetviewData = mitigationResult?.temperature_data?.streetview_metrics;
  const existingTrees = mitigationResult?.canopy_data?.trees || [];
  const proposedElements = mitigationResult?.forma_payload?.elements || [];

  return (
    <div className="relative flex-1 h-full bg-slate-950 flex flex-col overflow-hidden select-none border-r border-slate-800">
      {/* Autodesk Forma Viewport Header Ribbon */}
      <div className="h-11 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block shadow-sm"></span>
            Autodesk Forma 3D Viewport
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px] truncate max-w-[220px]">
            {preset.bbox.location_name}
          </span>
        </div>

        {/* Viewport Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Layer Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => {
                setShowThermalHeatmap(true);
                setHeatmapMode('temperature');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                showThermalHeatmap && heatmapMode === 'temperature'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>FortyGuard 2m Heat</span>
            </button>

            <button
              onClick={() => {
                setShowThermalHeatmap(true);
                setHeatmapMode('exceedance');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                showThermalHeatmap && heatmapMode === 'exceedance'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hours spent past 35°C (POST /v1/heatmap?analytic_type=exceedance)"
            >
              <Clock className="w-3 h-3 text-rose-400" />
              <span>Heat Exceedance</span>
            </button>

            <button
              onClick={() => {
                setShowThermalHeatmap(true);
                setHeatmapMode('satellite');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                showThermalHeatmap && heatmapMode === 'satellite'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Satellite Land-Cover Classification (POST /v1/satellite)"
            >
              <Building2 className="w-3 h-3 text-cyan-400" />
              <span>Satellite Albedo</span>
            </button>
          </div>

          {/* OSM Canopy Toggle */}
          <button
            onClick={() => setShowOsmCanopy(!showOsmCanopy)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              showOsmCanopy
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle OpenStreetMap Existing Canopy"
          >
            <Trees className="w-3 h-3 text-emerald-400" />
            <span>OSM Canopy</span>
          </button>

          {/* 3D / 2D Perspective Mode */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setViewMode('3D')}
              className={`px-2 py-1 rounded-md transition-all ${
                viewMode === '3D' ? 'bg-emerald-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D Iso
            </button>
            <button
              onClick={() => setViewMode('2D')}
              className={`px-2 py-1 rounded-md transition-all ${
                viewMode === '2D' ? 'bg-emerald-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2D Top
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D / 2D Simulated Canvas */}
      <div className="relative flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 overflow-hidden">
        {/* FortyGuard Live Environmental Parameters HUD (Top Left Floating) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-2xl max-w-xs text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              FortyGuard Microclimate HUD
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Live 2m
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Sun className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{envParams?.solar_irradiance_w_m2 || 685} W/m² Solar</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Wind className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>{envParams?.wind_speed_ms || 2.3} m/s Wind</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Droplets className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>{envParams?.relative_humidity_pct || 36}% Humidity</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Compass className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span>SVF {streetviewData?.sky_view_factor || 0.78}</span>
            </div>
          </div>

          {/* Active Overlay Subtitle */}
          <div className="mt-1 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Mode: {heatmapMode === 'temperature' ? '2m Temperature Snapshot' : heatmapMode === 'exceedance' ? 'Heat Hours >35°C' : 'Satellite Land Cover'}</span>
            <span className="text-amber-400 font-bold">
              {heatmapMode === 'temperature'
                ? `${mitigationResult?.temperature_data?.average_ambient_celsius || 35.2}°C`
                : heatmapMode === 'exceedance'
                ? '6.8h Exceedance'
                : '88.5% Impervious'}
            </span>
          </div>
        </div>

        {/* Selected Element Property Inspector Tooltip */}
        {selectedElement && (
          <div className="absolute top-4 right-4 z-20 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 shadow-2xl max-w-xs text-xs space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="font-semibold text-emerald-400 truncate max-w-[180px]">
                {selectedElement.name || selectedElement.species || 'Selected Asset'}
              </span>
              <button
                onClick={() => setSelectedElement(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
              {selectedElement.properties?.species && (
                <div>Species: {selectedElement.properties.species}</div>
              )}
              {selectedElement.properties?.crownDiameterMeters && (
                <div>Crown Diameter: {selectedElement.properties.crownDiameterMeters}m</div>
              )}
              {selectedElement.properties?.estimatedCoolingCelsius && (
                <div className="text-emerald-400">Cooling Impact: -{selectedElement.properties.estimatedCoolingCelsius}°C</div>
              )}
              {selectedElement.height && <div>Height: {selectedElement.height}m</div>}
            </div>
          </div>
        )}

        {/* Subtle Canvas Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #334155 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '32px 32px, 64px 64px, 64px 64px',
          }}
        />

        {/* 3D Canvas Container */}
        <div
          className={`relative w-full max-w-[620px] aspect-square rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl transition-all duration-500 overflow-hidden ${
            viewMode === '3D' ? 'rotate-x-12 rotate-z-[-6deg] scale-95 shadow-cyan-950/30' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            perspective: viewMode === '3D' ? '1200px' : 'none',
          }}
        >
          {/* Ground Surface Material & Urban Roads */}
          <div className="absolute inset-0 bg-slate-950">
            {/* North-South Main Boulevard */}
            <div className="absolute left-[45%] top-0 bottom-0 w-[10%] bg-slate-900 border-x border-slate-800/80">
              <div className="h-full border-r border-dashed border-slate-700/60 ml-[50%]" />
            </div>

            {/* Southern Pedestrian Promenade (Identified Hotspot Axis) */}
            <div className="absolute left-0 right-0 top-[70%] h-[16%] bg-slate-900/90 border-y border-amber-500/30">
              <div className="absolute right-3 top-1 text-[9px] font-mono text-amber-400/80 uppercase tracking-wider flex items-center gap-1 z-5">
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                Southern Promenade Axis
              </div>
            </div>

            {/* Central Core Plaza */}
            <div className="absolute left-[40%] top-[45%] w-[20%] h-[20%] rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Civic Plaza</span>
            </div>
          </div>

          {/* High-Albedo Cool Pavement Interventions (Rendered on Canvas along Promenade) */}
          {geometryRenderedOnCanvas && (
            <div className="absolute left-[6%] right-[6%] top-[73%] h-[10%] bg-gradient-to-r from-slate-100 via-white to-slate-100 border-2 border-emerald-400 rounded-md shadow-lg z-10 transition-all duration-700 animate-fadeIn flex items-center justify-between px-3">
              <span className="text-[10px] font-mono text-slate-900 font-bold tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                High-Albedo Reflective Pavement (SRI 82, -8.6°C Surface)
              </span>
              <span className="text-[8px] font-mono text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                TiO₂ Active
              </span>
            </div>
          )}

          {/* FortyGuard Heatmap Grid Overlay (Multi-Mode) */}
          {showThermalHeatmap && (
            <div className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300">
              <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-1 p-2 opacity-65">
                {currentHeatPoints.map((pt, i) => {
                  let bgColor = getTempColor(pt.temperature_celsius);
                  let label = `${Math.round(pt.temperature_celsius)}°`;

                  if (heatmapMode === 'exceedance') {
                    bgColor = getExceedanceColor(pt.exceedance_hours || 4);
                    label = `${pt.exceedance_hours || 4}h`;
                  } else if (heatmapMode === 'satellite') {
                    const row = Math.floor(i / 8);
                    bgColor = row === 5 || row === 6 ? 'rgba(71, 85, 105, 0.8)' : row > 3 ? 'rgba(51, 65, 85, 0.7)' : 'rgba(16, 185, 129, 0.4)';
                    label = row === 5 || row === 6 ? 'Asphalt' : row > 3 ? 'Roof' : 'Tree';
                  }

                  return (
                    <div
                      key={i}
                      className="rounded-sm transition-all duration-300 flex items-center justify-center font-mono font-bold text-[9px] text-white/95 drop-shadow-sm"
                      style={{ backgroundColor: bgColor }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3D Buildings in Context with High-Legibility Badges */}
          {preset.buildings.map((bld) => (
            <div
              key={bld.id}
              onClick={() => setSelectedElement(bld)}
              className={`absolute rounded-lg border cursor-pointer transition-all duration-300 z-15 flex flex-col justify-between p-1.5 ${
                bld.type === 'commercial'
                  ? 'bg-slate-850/95 border-slate-600 shadow-xl'
                  : bld.type === 'residential'
                  ? 'bg-slate-850/90 border-slate-700 shadow-lg'
                  : 'bg-slate-900 border-slate-800'
              }`}
              style={{
                left: `${bld.x * 100 - bld.width / 8}%`,
                top: `${bld.y * 100 - bld.depth / 8}%`,
                width: `${Math.max(22, bld.width / 3.4)}%`,
                height: `${Math.max(14, bld.depth / 3.8)}%`,
                boxShadow:
                  viewMode === '3D'
                    ? `-${bld.height / 3.5}px ${bld.height / 2.5}px 0px rgba(15, 23, 42, 0.95)`
                    : 'none',
              }}
            >
              <span className="text-[10px] font-semibold text-slate-200 truncate leading-tight">{bld.name}</span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">{bld.height}m Height</span>
            </div>
          ))}

          {/* OpenStreetMap Existing Trees (Northern Park Zone) */}
          {showOsmCanopy &&
            existingTrees.map((tree: any, i: number) => {
              const xNorm = tree.center ? (tree.center[0] > 1 ? (tree.center[0] - preset.bbox.min_x) / (preset.bbox.max_x - preset.bbox.min_x) : tree.center[0]) : 0.2 + i * 0.15;
              const screenY = tree.center ? (tree.center[1] > 1 ? 1.0 - ((tree.center[1] - preset.bbox.min_y) / (preset.bbox.max_y - preset.bbox.min_y)) : (tree.center[1] < 0.5 ? 0.2 + tree.center[1] : 1.0 - tree.center[1])) : 0.25;

              return (
                <div
                  key={tree.id}
                  onClick={() => setSelectedElement(tree)}
                  className="absolute z-20 cursor-pointer group"
                  style={{
                    left: `${xNorm * 100}%`,
                    top: `${screenY * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`${tree.species} (${tree.crown_diameter || 9}m Crown)`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-700/90 border border-emerald-400 shadow-lg shadow-emerald-950 flex items-center justify-center text-xs text-white transition-transform group-hover:scale-125">
                    🌳
                  </div>
                </div>
              );
            })}

          {/* Autodesk Forma Actuated Interventions (Southern Promenade Trees & Pergolas) */}
          {geometryRenderedOnCanvas &&
            proposedElements.map((el, i) => {
              const tx = el.transform_matrix[12];
              const ty = el.transform_matrix[13];
              
              const geoYNorm = ty > 1 ? (ty - preset.bbox.min_y) / (preset.bbox.max_y - preset.bbox.min_y) : 0.22;
              const screenY = 1.0 - geoYNorm;
              const xNorm = tx > 1 ? (tx - preset.bbox.min_x) / (preset.bbox.max_x - preset.bbox.min_x) : 0.14 + i * 0.11;

              if (el.element_type === 'vegetation_tree') {
                return (
                  <div
                    key={el.urn}
                    onClick={() => setSelectedElement(el)}
                    className="absolute z-25 cursor-pointer group"
                    style={{
                      left: `${xNorm * 100}%`,
                      top: `${screenY * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`${el.name} (${el.properties?.species || 'Platanus x hispanica'} - 9m Crown, -3.4°C)`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 border-2 border-white shadow-xl flex items-center justify-center text-xs text-white transition-all transform group-hover:scale-125 ring-2 ring-emerald-400/60 ring-offset-1 ring-offset-slate-950">
                      🌳
                    </div>
                  </div>
                );
              }

              if (el.element_type === 'shade_structure') {
                return (
                  <div
                    key={el.urn}
                    onClick={() => setSelectedElement(el)}
                    className="absolute z-25 cursor-pointer group"
                    style={{
                      left: '50%',
                      top: '55%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    title="Tensile UV-Block Shade Sail (Central Core Plaza, -4.8°C)"
                  >
                    <div className="w-20 h-16 rounded-xl bg-amber-500/75 border-2 border-amber-300 shadow-2xl flex items-center justify-center text-[9px] font-bold text-slate-950 uppercase tracking-tight transition-transform group-hover:scale-110">
                      Tensile Shade
                    </div>
                  </div>
                );
              }

              return null;
            })}
        </div>
      </div>
    </div>
  );
};

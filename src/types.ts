/**
 * FormaGuard Core TypeScript Types & Interfaces
 */

export interface BoundingBox {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
  elevation_min?: number;
  elevation_max?: number;
  crs?: string;
  location_name?: string;
}

export interface HeatPoint {
  x: number;
  y: number;
  temperature_celsius: number;
  surface_temp_celsius: number;
  humidity_pct: number;
  heat_index_celsius: number;
  solar_exposure_kwh_m2: number;
  vulnerability_score: number;
  exceedance_hours?: number; // Hours spent > 35°C
  peak_hour_utc?: number; // Hour of peak temperature (0-23)
}

export interface EnvironmentalParameters {
  ambient_temp_celsius: number;
  relative_humidity_pct: number;
  wind_speed_ms: number;
  solar_irradiance_w_m2: number;
  mean_radiant_temp_celsius: number;
  wet_bulb_globe_temp_celsius: number;
  heat_index_celsius: number;
  uv_index: number;
}

export interface SatelliteSegmentation {
  building_pct: number;
  asphalt_road_pct: number;
  tree_canopy_pct: number;
  grass_vegetation_pct: number;
  bare_soil_pct: number;
  mean_albedo: number;
  ndvi_vegetation_index: number;
}

export interface StreetViewMetrics {
  sky_view_factor: number; // 0.0 to 1.0
  pedestrian_shade_pct: number;
  ground_albedo_index: number;
  human_thermal_comfort_pmv: number;
}

export interface HeatIntelligenceAudit {
  uhi_intensity_score: number; // 0-100
  osha_heat_stress_category: 'Low Risk' | 'Moderate' | 'High Risk' | 'Danger';
  ashrae_55_compliance_pct: number;
  epa_cool_corridor_eligible: boolean;
  usda_urban_forestry_grant_fit: string;
  key_findings: string[];
}

export interface FortyGuardResponse {
  status: string;
  provider: string;
  sensor_elevation: string;
  timestamp: string;
  bounding_box: BoundingBox;
  average_ambient_celsius: number;
  peak_surface_celsius: number;
  mean_radiant_temp_celsius: number;
  hotspots_count: number;
  thermal_stress_level: 'Extreme' | 'High' | 'Moderate' | 'Low';
  exceedance_threshold_celsius: number;
  mean_exceedance_hours_daily: number;
  max_persistence_hours: number;
  heat_points: HeatPoint[];
  environmental_params: EnvironmentalParameters;
  satellite_segmentation: SatelliteSegmentation;
  streetview_metrics: StreetViewMetrics;
  heat_intelligence: HeatIntelligenceAudit;
  critical_hotspot_centroids: Array<{
    cluster_name: string;
    x: number;
    y: number;
    peak_heat_index_celsius: number;
    primary_cause: string;
  }>;
}

export interface ExistingTree {
  id: string;
  species: string;
  type: string;
  center: [number, number, number];
  radius_meters: number;
  height_meters: number;
  health_ndvi: number;
  crown_diameter: number;
  shade_capacity_m2: number;
}

export interface OsmCanopyResponse {
  status: string;
  source: string;
  bounding_box: BoundingBox;
  existing_trees_count: number;
  total_canopy_area_m2: number;
  site_total_area_m2: number;
  canopy_coverage_pct: number;
  ndvi_mean: number;
  trees: ExistingTree[];
  canopy_deficiency_zones: Array<{
    zone_name: string;
    coverage_pct: number;
    status: string;
    recommended_canopy_addition_m2: number;
  }>;
}

export interface ProposedIntervention {
  id: string;
  category: 'canopy_tree' | 'high_albedo_pavement' | 'pergola_shade' | 'bioswale' | string;
  name: string;
  species?: string;
  target_corridor: string;
  geometry_type: string;
  coordinates: [number, number, number];
  dimensions: Record<string, any>;
  estimated_cooling_celsius: number;
  co2_sequestration_kg_yr: number;
  cost_estimate_usd: number;
  polygon_vertices?: [number, number, number][];
}

export interface MitigationPlan {
  summary_command: string;
  overall_thermal_reduction_celsius: number;
  surface_temp_drop_celsius: number;
  target_canopy_increase_pct: number;
  priority_level: string;
  interventions: ProposedIntervention[];
  rationale: string;
  bounding_box: BoundingBox;
}

export interface FormaElementPayload {
  urn: string;
  authgroupId: string;
  element_type: 'vegetation_tree' | 'surface_albedo_layer' | 'shade_structure' | 'generic_mitigation_asset';
  name: string;
  transform_matrix: number[];
  properties: Record<string, any>;
  geometry: Record<string, any>;
}

export interface FormaActuatorResponse {
  status: string;
  forma_api_version: string;
  action: string;
  commit_target: string;
  bounding_box: BoundingBox;
  total_elements: number;
  elements: FormaElementPayload[];
  spatial_distribution_summary: {
    canopy_trees_added: number;
    cool_surfaces_added: number;
    shade_structures_added: number;
    estimated_cooling_impact_celsius: number;
    urban_heat_island_risk_reduction: string;
  };
}

export interface AgentStepTrace {
  step: number;
  agent: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  executionTimeMs: number;
  summary: string;
  details?: Record<string, any>;
}

export interface MitigationRunResult {
  status: string;
  execution_time_seconds: number;
  bounding_box: BoundingBox;
  thermal_risk_score: number;
  mitigation_command: string;
  temperature_data: FortyGuardResponse;
  canopy_data: OsmCanopyResponse;
  mitigation_plan: MitigationPlan;
  forma_payload: FormaActuatorResponse;
  thought_trace: AgentStepTrace[];
  final_response: string;
}

export interface UrbanBuilding {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  type: 'commercial' | 'residential' | 'civic';
}

export interface UrbanPreset {
  id: string;
  name: string;
  city: string;
  country: string;
  bbox: BoundingBox;
  buildings: UrbanBuilding[];
  baseline_temperature: number;
  baseline_canopy_pct: number;
  description: string;
}

/**
 * Autodesk Forma Elements & Forma Embedded Extension SDK Type Definitions
 */

export interface FormaBoundingBox {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
  crs?: string;
  elevation_min?: number;
  elevation_max?: number;
}

export interface FormaCameraState {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  heading: number;
}

export interface FormaMaterial {
  colorHex: string;
  roughness?: number;
  metallic?: number;
  translucency?: number;
}

export interface FormaProceduralTreeGeometry {
  format: 'forma_procedural_tree';
  trunkHeight: number;
  trunkRadius: number;
  canopyShape: 'ellipsoid' | 'conical' | 'spherical';
  canopyRadiusX: number;
  canopyRadiusY: number;
  canopyRadiusZ: number;
  material: FormaMaterial;
}

export interface FormaPolygonMeshGeometry {
  format: 'polygon_mesh';
  vertices: [number, number, number][];
  material: FormaMaterial;
}

export interface FormaShadeSailGeometry {
  format: 'parametric_shade_sail';
  posts: [number, number, number][];
  canopyHeight: number;
  material: FormaMaterial;
}

export type FormaGeometry =
  | FormaProceduralTreeGeometry
  | FormaPolygonMeshGeometry
  | FormaShadeSailGeometry
  | { format: string; [key: string]: any };

export interface FormaElement {
  urn: string;
  authgroupId?: string;
  element_type: 'vegetation_tree' | 'surface_albedo_layer' | 'shade_structure' | string;
  name: string;
  transform_matrix: number[]; // 16 float matrix
  properties: {
    category?: string;
    species?: string;
    crownDiameterMeters?: number;
    heightMeters?: number;
    albedoFactor?: number;
    albedo?: number;
    solarReflectiveIndex?: number;
    surfaceTemperatureDropCelsius?: number;
    evapotranspirationCoolingWatts?: number;
    shadeAreaM2?: number;
    [key: string]: any;
  };
  geometry: FormaGeometry;
}

export interface FormaActuatorPayload {
  status: string;
  forma_api_version: string;
  action: string;
  commit_target: string;
  bounding_box: FormaBoundingBox;
  total_elements: number;
  elements: FormaElement[];
  spatial_distribution_summary?: {
    canopy_trees_added: number;
    cool_surfaces_added: number;
    shade_structures_added: number;
    estimated_cooling_impact_celsius: number;
    urban_heat_island_risk_reduction: string;
  };
}

export interface AgentThoughtMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  agent?: string;
  content: string;
  timestamp: string;
  tool_call?: Record<string, any>;
}

export interface MitigationResponse {
  status: string;
  execution_time_seconds: number;
  bounding_box: FormaBoundingBox;
  thermal_risk_score: number;
  mitigation_command: string;
  temperature_summary: {
    average_ambient_celsius: number;
    peak_surface_celsius: number;
    projected_ambient_celsius: number;
    cooling_delta_celsius: number;
  };
  canopy_summary: {
    initial_coverage_pct: number;
    target_coverage_pct: number;
    trees_added: number;
  };
  mitigation_plan: {
    summary_command: string;
    overall_thermal_reduction_celsius: number;
    surface_temp_drop_celsius: number;
    target_canopy_increase_pct: number;
    priority_level: string;
    rationale: string;
    interventions: any[];
  };
  forma_geometry_payload: FormaActuatorPayload;
  agent_thought_trace: AgentThoughtMessage[];
  final_response: string;
}

"""
FormaGuard Python FastAPI Backend.

Provides endpoints for:
- `/api/mitigate`: Full LangGraph multi-agent loop execution for heat mitigation.
- `/api/tools/temperature`: Standalone FortyGuard 2m thermal sensing tool.
- `/api/tools/canopy`: Standalone OpenStreetMap canopy extraction tool.
- `/api/tools/actuate`: Standalone Forma Design API actuator formatter.
- `/api/health`: Cloud Run readiness and liveness probes.
"""

from typing import Dict, Any, Optional
import time
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    from agent_backend.config import settings
    from agent_backend.state import BoundingBox, AgentState
    from agent_backend.tools import get_fortyguard_temperature, get_osm_canopy, forma_design_actuator
    from agent_backend.graph import orchestrator
except ImportError:
    from config import settings
    from state import BoundingBox, AgentState
    from tools import get_fortyguard_temperature, get_osm_canopy, forma_design_actuator
    from graph import orchestrator

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous heat-mitigation LangGraph agent backend for Autodesk Forma extensions.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# -----------------------------------------------------------------------------
# Explicit CORS Middleware Configuration
# Exact origins from ALLOWED_ORIGINS; regex covers Pages / Forma / Firebase hosts
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Agent-Execution-Time", "X-FormaGuard-Version"],
    max_age=86400,  # 24 hours preflight cache
)


# Request schemas
class MitigateRequest(BaseModel):
    bounding_box: BoundingBox
    user_prompt: Optional[str] = Field(
        default="Perform autonomous thermal risk assessment and generate mitigation geometry for Forma canvas",
        description="Natural language instruction or command from Copilot"
    )
    target_reduction_celsius: Optional[float] = Field(default=3.0, description="Desired temperature drop")


class ToolTemperatureRequest(BaseModel):
    bounding_box: BoundingBox


class ToolCanopyRequest(BaseModel):
    bounding_box: BoundingBox


class ToolActuatorRequest(BaseModel):
    mitigation_plan: Dict[str, Any]


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

@app.get("/api/health", tags=["Monitoring"])
async def health_check():
    """
    Health check endpoint for Google Cloud Run container readiness & liveness probes.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "runtime": "Python FastAPI / Uvicorn + LangGraph",
        "timestamp": time.time()
    }


@app.post("/api/mitigate", tags=["Orchestration"])
async def run_mitigation_pipeline(payload: MitigateRequest):
    """
    Primary endpoint: Executes the multi-agent LangGraph orchestration loop.
    
    1. Senses 2m microclimate heat from FortyGuard & canopy from OSM.
    2. Identifies heat vulnerability and deficit zones.
    3. Synthesizes spatial canopy and cool pavement plans.
    4. Actuates the plan into Autodesk Forma Elements SDK compatible JSON geometry.
    """
    start_time = time.time()
    try:
        initial_state: AgentState = {
            "messages": [],
            "bounding_box": payload.bounding_box.dict(),
            "user_prompt": payload.user_prompt,
            "temperature_data": None,
            "canopy_data": None,
            "thermal_risk_score": None,
            "identified_hotspots": None,
            "mitigation_plan": None,
            "forma_payload": None,
            "active_agent": "Starting",
            "iteration": 0,
            "final_response": None
        }
        
        # Execute LangGraph orchestration loop
        final_state = orchestrator.run(initial_state)
        elapsed_sec = round(time.time() - start_time, 3)
        
        response_data = {
            "status": "success",
            "execution_time_seconds": elapsed_sec,
            "bounding_box": payload.bounding_box.dict(),
            "thermal_risk_score": final_state.get("thermal_risk_score"),
            "mitigation_command": final_state.get("mitigation_plan", {}).get("summary_command"),
            "temperature_summary": {
                "average_ambient_celsius": final_state.get("temperature_data", {}).get("average_ambient_celsius"),
                "peak_surface_celsius": final_state.get("temperature_data", {}).get("peak_surface_celsius"),
                "projected_ambient_celsius": round(
                    final_state.get("temperature_data", {}).get("average_ambient_celsius", 35.0) - 
                    final_state.get("mitigation_plan", {}).get("overall_thermal_reduction_celsius", 4.2), 2
                ),
                "cooling_delta_celsius": final_state.get("mitigation_plan", {}).get("overall_thermal_reduction_celsius", 4.2)
            },
            "canopy_summary": {
                "initial_coverage_pct": final_state.get("canopy_data", {}).get("canopy_coverage_pct"),
                "target_coverage_pct": round(
                    final_state.get("canopy_data", {}).get("canopy_coverage_pct", 4.0) +
                    final_state.get("mitigation_plan", {}).get("target_canopy_increase_pct", 15.4), 2
                ),
                "trees_added": len([
                    e for e in final_state.get("forma_payload", {}).get("elements", [])
                    if e.get("element_type") == "vegetation_tree"
                ])
            },
            "mitigation_plan": final_state.get("mitigation_plan"),
            "forma_geometry_payload": final_state.get("forma_payload"),
            "agent_thought_trace": final_state.get("messages", []),
            "final_response": final_state.get("final_response")
        }
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=response_data,
            headers={"X-Agent-Execution-Time": str(elapsed_sec)}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangGraph Agent execution failed: {str(e)}"
        )


@app.post("/api/tools/temperature", tags=["Tools"])
async def tool_temperature(payload: ToolTemperatureRequest):
    """Direct access to FortyGuard 2m Microclimate Temperature tool."""
    return get_fortyguard_temperature(payload.bounding_box.dict())


@app.post("/api/tools/canopy", tags=["Tools"])
async def tool_canopy(payload: ToolCanopyRequest):
    """Direct access to OpenStreetMap Urban Canopy LiDAR tool."""
    return get_osm_canopy(payload.bounding_box.dict())


@app.post("/api/tools/actuate", tags=["Tools"])
async def tool_actuate(payload: ToolActuatorRequest):
    """Direct access to Autodesk Forma Design API Actuator tool."""
    return forma_design_actuator(payload.mitigation_plan)


if __name__ == "__main__":
    import uvicorn
    # Local direct execution support
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)

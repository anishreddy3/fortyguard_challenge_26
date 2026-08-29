#!/usr/bin/env python3
"""
FormaGuard — Multi-City FortyGuard API Batch Simulation & Benchmarking Pipeline.

Submits and evaluates FortyGuard 2m Microclimate, Environmental Parameters,
Satellite Land-Cover, and Street-View assessments across 5 global urban archetypes:
1. Dubai, UAE (Desert Metropole)
2. Singapore (Equatorial Tropical Wetland)
3. Manhattan, NYC, USA (High-Density Urban Canyon)
4. Phoenix, AZ, USA (Sunbelt Sprawl & Extreme Solar)
5. London, UK (Temperate Heatwave & Dense Heritage)
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List
import requests
import dotenv

# Load environment
dotenv.load_dotenv()
API_KEY = os.getenv("FORTYGUARD_API_KEY")
BASE_URL = os.getenv("FORTYGUARD_BASE_URL", "https://api.fortyguard.com").rstrip("/")

if not API_KEY:
    print("[ERROR] FORTYGUARD_API_KEY missing from .env file.")
    sys.exit(1)

HEADERS = {
    "api-key": API_KEY,
    "Content-Type": "application/json"
}

OUTPUT_DIR = Path("data/simulations")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------------------------------
# Scenario Definitions
# -------------------------------------------------------------------------
SCENARIOS = [
    {
        "id": "dubai",
        "name": "Dubai Downtown / Business Bay",
        "country": "United Arab Emirates",
        "climate": "BWh (Hyper-Arid Hot Desert)",
        "latitude": 25.1972,
        "longitude": 55.2744,
        "temperature": 43.8,
        "date": "2026-08-15",
        "time": "14:00",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Dubai Downtown AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [55.2680, 25.1920],
                        [55.2820, 25.1920],
                        [55.2820, 25.2040],
                        [55.2680, 25.2040],
                        [55.2680, 25.1920]
                    ]]
                }
            }]
        }
    },
    {
        "id": "singapore",
        "name": "Jurong Eco-Garden & CleanTech Park",
        "country": "Singapore",
        "climate": "Af (Tropical Rainforest / Humid)",
        "latitude": 1.3483,
        "longitude": 103.6831,
        "temperature": 34.2,
        "date": "2026-08-15",
        "time": "13:00",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Jurong Eco-Garden AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [103.6760, 1.3420],
                        [103.6900, 1.3420],
                        [103.6900, 1.3540],
                        [103.6760, 1.3540],
                        [103.6760, 1.3420]
                    ]]
                }
            }]
        }
    },
    {
        "id": "manhattan",
        "name": "Manhattan Financial District & Wall St",
        "country": "United States",
        "climate": "Cfa (Humid Subtropical Urban Canyon)",
        "latitude": 40.7075,
        "longitude": -74.0090,
        "temperature": 36.5,
        "date": "2026-07-22",
        "time": "15:00",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Lower Manhattan AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-74.0170, 40.7050],
                        [-74.0030, 40.7050],
                        [-74.0030, 40.7180],
                        [-74.0170, 40.7180],
                        [-74.0170, 40.7050]
                    ]]
                }
            }]
        }
    },
    {
        "id": "phoenix",
        "name": "Phoenix Downtown Innovation Corridor",
        "country": "United States",
        "climate": "BWh (Hot Desert / Sprawl UHI)",
        "latitude": 33.4484,
        "longitude": -112.0740,
        "temperature": 45.2,
        "date": "2026-07-15",
        "time": "16:00",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Phoenix Innovation AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-112.0820, 33.4420],
                        [-112.0660, 33.4420],
                        [-112.0660, 33.4560],
                        [-112.0820, 33.4560],
                        [-112.0820, 33.4420]
                    ]]
                }
            }]
        }
    },
    {
        "id": "london",
        "name": "King's Cross & Camden Regeneration Area",
        "country": "United Kingdom",
        "climate": "Cfb (Oceanic Temperate Heatwave)",
        "latitude": 51.5308,
        "longitude": -0.1238,
        "temperature": 33.4,
        "date": "2026-07-19",
        "time": "14:00",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "King's Cross AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-0.1320, 51.5250],
                        [-0.1160, 51.5250],
                        [-0.1160, 51.5370],
                        [-0.1320, 51.5370],
                        [-0.1320, 51.5250]
                    ]]
                }
            }]
        }
    }
]

# -------------------------------------------------------------------------
# API Helper Functions
# -------------------------------------------------------------------------
def submit_endpoint(endpoint: str, payload: dict) -> str:
    url = f"{BASE_URL}{endpoint}"
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=60)
    if not resp.ok:
        raise RuntimeError(f"POST {endpoint} -> {resp.status_code}: {resp.text}")
    data = resp.json()
    if data.get("error"):
        raise RuntimeError(f"POST {endpoint} error: {data.get('message')}")
    return data["data"]["activity_id"]

def poll_activity(activity_id: str, timeout: float = 300.0, interval: float = 4.0) -> dict:
    url = f"{BASE_URL}/v1/status/{activity_id}"
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            if resp.status_code == 200:
                body = resp.json()
                data = body.get("data", {})
                status = str(data.get("status", "")).lower()
                if status in ("succeeded", "completed"):
                    return data.get("result", data)
                elif status in ("failed", "error"):
                    print(f"    [WARN] Activity {activity_id} failed: {data.get('message')}")
                    return data
        except Exception as e:
            print(f"    [POLL WARN] {e}")
        time.sleep(interval)
    print(f"    [TIMEOUT] Activity {activity_id} reached deadline {timeout}s.")
    return {"status": "timeout", "activity_id": activity_id}

# -------------------------------------------------------------------------
# Main Multi-City Batch Execution
# -------------------------------------------------------------------------
def run_all_simulations():
    print("=" * 80)
    print("🌍 FORMAGUARD MULTI-CITY FORTYGUARD API BATCH SIMULATION SUITE")
    print(f"Target API Base: {BASE_URL}")
    print(f"Scenarios: {len(SCENARIOS)} Global Archetypes")
    print("=" * 80)

    all_results: Dict[str, Any] = {}
    submitted_tasks: List[dict] = []

    # Phase 1: Submit all queries asynchronously
    for scen in SCENARIOS:
        city_id = scen["id"]
        city_dir = OUTPUT_DIR / city_id
        city_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n📍 Submitting Suite for: {scen['name']} ({scen['climate']})")

        # 1. Environmental Parameters
        try:
            env_payload = {
                "latitude": scen["latitude"],
                "longitude": scen["longitude"],
                "temperature": scen["temperature"],
                "date_time": {
                    "start_date": scen["date"],
                    "filter_type": 1,
                    "start_time": scen["time"]
                }
            }
            env_act = submit_endpoint("/v1/env_params", env_payload)
            submitted_tasks.append({
                "city_id": city_id,
                "endpoint": "env_params",
                "activity_id": env_act,
                "payload": env_payload
            })
            print(f"  ✓ /v1/env_params -> Activity {env_act}")
        except Exception as e:
            print(f"  ✗ /v1/env_params submit failed: {e}")

        # 2. Satellite Land-Cover Segmentation
        try:
            sat_payload = {
                "sat": {
                    "latitude": scen["latitude"],
                    "longitude": scen["longitude"]
                },
                "date_time": {
                    "start_date": scen["date"],
                    "filter_type": 1,
                    "start_time": scen["time"]
                },
                "granularity": 100
            }
            sat_act = submit_endpoint("/v1/satellite", sat_payload)
            submitted_tasks.append({
                "city_id": city_id,
                "endpoint": "satellite",
                "activity_id": sat_act,
                "payload": sat_payload
            })
            print(f"  ✓ /v1/satellite -> Activity {sat_act}")
        except Exception as e:
            print(f"  ✗ /v1/satellite submit failed: {e}")

        # 3. Street-View Pedestrian Sky View Factor (SVF)
        try:
            svf_payload = {
                "latitude": scen["latitude"],
                "longitude": scen["longitude"],
                "vertical_angle": 0.0,
                "horizontal_angle": 0.0,
                "back_view": False
            }
            svf_act = submit_endpoint("/v1/streetview", svf_payload)
            submitted_tasks.append({
                "city_id": city_id,
                "endpoint": "streetview",
                "activity_id": svf_act,
                "payload": svf_payload
            })
            print(f"  ✓ /v1/streetview -> Activity {svf_act}")
        except Exception as e:
            print(f"  ✗ /v1/streetview submit failed: {e}")

        # 4. Dense 2m Heatmap (TCM)
        try:
            heat_payload = {
                "polygon_aoi": scen["polygon"],
                "date_time": {
                    "start_date": scen["date"],
                    "filter_type": 1,
                    "start_time": scen["time"]
                },
                "granularity": 100,
                "analytic_type": "tcm"
            }
            heat_act = submit_endpoint("/v1/heatmap", heat_payload)
            submitted_tasks.append({
                "city_id": city_id,
                "endpoint": "heatmap_tcm",
                "activity_id": heat_act,
                "payload": heat_payload
            })
            print(f"  ✓ /v1/heatmap (tcm) -> Activity {heat_act}")
        except Exception as e:
            print(f"  ✗ /v1/heatmap submit failed: {e}")

        # 5. Exceedance Analysis (>32°C)
        try:
            exc_payload = {
                "polygon_aoi": scen["polygon"],
                "date_time": {
                    "start_date": scen["date"],
                    "filter_type": 3  # single day
                },
                "granularity": 100,
                "analytic_type": "exceedance",
                "threshold": 32.0,
                "direction": "above"
            }
            exc_act = submit_endpoint("/v1/heatmap", exc_payload)
            submitted_tasks.append({
                "city_id": city_id,
                "endpoint": "heatmap_exceedance",
                "activity_id": exc_act,
                "payload": exc_payload
            })
            print(f"  ✓ /v1/heatmap (exceedance) -> Activity {exc_act}")
        except Exception as e:
            print(f"  ✗ /v1/heatmap (exceedance) submit failed: {e}")

    print("\n" + "=" * 80)
    print(f"🚀 SUBMITTED {len(submitted_tasks)} ASYNC TASKS ACROSS 5 CITIES. POLLING FOR RESULTS...")
    print("=" * 80)

    # Phase 2: Poll and collect results
    for i, task in enumerate(submitted_tasks, 1):
        city_id = task["city_id"]
        ep = task["endpoint"]
        act_id = task["activity_id"]
        print(f"[{i}/{len(submitted_tasks)}] Polling {city_id.upper()} {ep} (Activity: {act_id})...")
        
        result = poll_activity(act_id, timeout=180.0, interval=4.0)
        
        if city_id not in all_results:
            all_results[city_id] = {
                "metadata": next((s for s in SCENARIOS if s["id"] == city_id), {}),
                "endpoints": {}
            }
        
        all_results[city_id]["endpoints"][ep] = {
            "activity_id": act_id,
            "status": "completed" if "error" not in result else "failed",
            "data": result
        }

        # Save individual endpoint JSON artifact
        artifact_path = OUTPUT_DIR / city_id / f"{ep}.json"
        with open(artifact_path, "w") as f:
            json.dump(result, f, indent=2)

    # Save comprehensive benchmark suite
    master_path = OUTPUT_DIR / "multi_city_benchmark_results.json"
    with open(master_path, "w") as f:
        json.dump(all_results, f, indent=2)

    print("\n" + "=" * 80)
    print(f"✅ ALL SIMULATIONS COMPLETED & SAVED TO {master_path}")
    print("=" * 80)

if __name__ == "__main__":
    run_all_simulations()

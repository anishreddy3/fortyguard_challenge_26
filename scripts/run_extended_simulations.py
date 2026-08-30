#!/usr/bin/env python3
"""
FormaGuard — Extended Global Scenarios Simulation Suite.

Simulates 5 additional world metropolises to evaluate microclimate mitigation:
6. Tokyo, Japan (High-Density Humid Megacity)
7. Madrid, Spain (Iberian Mediterranean Heatwave)
8. Riyadh, Saudi Arabia (Extreme GCC Inland Desert)
9. Sydney, Australia (Coastal Subtropical / APAC)
10. Los Angeles, USA (Pacific Sunbelt Sprawl & Inversion)
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List
import requests
import dotenv

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

EXTENDED_SCENARIOS = [
    {
        "id": "tokyo",
        "name": "Tokyo Shinjuku & Shibuya District",
        "country": "Japan",
        "climate": "Cfa (Humid Subtropical Asian Megacity)",
        "latitude": 35.6895,
        "longitude": 139.6917,
        "temperature": 35.8,
        "date": "2026-08-10",
        "time": "14:00",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Shinjuku Central AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [139.6840, 35.6830],
                        [139.6990, 35.6830],
                        [139.6990, 35.6960],
                        [139.6840, 35.6960],
                        [139.6840, 35.6830]
                    ]]
                }
            }]
        }
    },
    {
        "id": "madrid",
        "name": "Madrid Centro & Gran Vía Corridor",
        "country": "Spain",
        "climate": "Csa (Mediterranean Inland Heatwave)",
        "latitude": 40.4168,
        "longitude": -3.7038,
        "temperature": 39.4,
        "date": "2026-07-28",
        "time": "16:00",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Gran Via AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-3.7120, 40.4120],
                        [-3.6960, 40.4120],
                        [-3.6960, 40.4220],
                        [-3.7120, 40.4220],
                        [-3.7120, 40.4120]
                    ]]
                }
            }]
        }
    },
    {
        "id": "riyadh",
        "name": "Riyadh King Abdullah Financial District (KAFD)",
        "country": "Saudi Arabia",
        "climate": "BWh (Extreme Inland Desert)",
        "latitude": 24.7136,
        "longitude": 46.6753,
        "temperature": 46.5,
        "date": "2026-08-05",
        "time": "14:30",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "KAFD Corridor AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [46.6660, 24.7060],
                        [46.6840, 24.7060],
                        [46.6840, 24.7210],
                        [46.6660, 24.7210],
                        [46.6660, 24.7060]
                    ]]
                }
            }]
        }
    },
    {
        "id": "sydney",
        "name": "Sydney Barangaroo & Circular Quay",
        "country": "Australia",
        "climate": "Cfa (Temperate Oceanic / Coastal)",
        "latitude": -33.8688,
        "longitude": 151.2093,
        "temperature": 34.0,
        "date": "2026-01-20",
        "time": "13:30",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Barangaroo Harbor AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [151.2010, -33.8740],
                        [151.2170, -33.8740],
                        [151.2170, -33.8630],
                        [151.2010, -33.8630],
                        [151.2010, -33.8740]
                    ]]
                }
            }]
        }
    },
    {
        "id": "los_angeles",
        "name": "Los Angeles Downtown Arts District",
        "country": "United States",
        "climate": "Csa (Mediterranean Coastal Basin Sprawl)",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "temperature": 38.2,
        "date": "2026-08-25",
        "time": "15:00",
        "polygon": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "DTLA Arts District AOI"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-118.2520, 34.0440],
                        [-118.2350, 34.0440],
                        [-118.2350, 34.0600],
                        [-118.2520, 34.0600],
                        [-118.2520, 34.0440]
                    ]]
                }
            }]
        }
    }
]

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
                    return data
        except Exception:
            pass
        time.sleep(interval)
    return {"status": "timeout", "activity_id": activity_id}

def run_extended():
    print("=" * 80)
    print("🌍 FORMAGUARD EXTENDED SIMULATION SUITE (TOKYO, MADRID, RIYADH, SYDNEY, LA)")
    print("=" * 80)

    submitted_tasks: List[dict] = []

    for scen in EXTENDED_SCENARIOS:
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
            act = submit_endpoint("/v1/env_params", env_payload)
            submitted_tasks.append({"city_id": city_id, "endpoint": "env_params", "activity_id": act})
            print(f"  ✓ /v1/env_params -> Activity {act}")
        except Exception as e:
            print(f"  ✗ env_params error: {e}")

        # 2. Satellite Land-Cover
        try:
            sat_payload = {
                "sat": {"latitude": scen["latitude"], "longitude": scen["longitude"]},
                "date_time": {"start_date": scen["date"], "filter_type": 1, "start_time": scen["time"]},
                "granularity": 100
            }
            act = submit_endpoint("/v1/satellite", sat_payload)
            submitted_tasks.append({"city_id": city_id, "endpoint": "satellite", "activity_id": act})
            print(f"  ✓ /v1/satellite -> Activity {act}")
        except Exception as e:
            print(f"  ✗ satellite error: {e}")

        # 3. Street-View SVF
        try:
            svf_payload = {
                "latitude": scen["latitude"],
                "longitude": scen["longitude"],
                "vertical_angle": 0.0,
                "horizontal_angle": 0.0,
                "back_view": False
            }
            act = submit_endpoint("/v1/streetview", svf_payload)
            submitted_tasks.append({"city_id": city_id, "endpoint": "streetview", "activity_id": act})
            print(f"  ✓ /v1/streetview -> Activity {act}")
        except Exception as e:
            print(f"  ✗ streetview error: {e}")

        # 4. Dense 2m Heatmap (TCM)
        try:
            heat_payload = {
                "polygon_aoi": scen["polygon"],
                "date_time": {"start_date": scen["date"], "filter_type": 1, "start_time": scen["time"]},
                "granularity": 100,
                "analytic_type": "tcm"
            }
            act = submit_endpoint("/v1/heatmap", heat_payload)
            submitted_tasks.append({"city_id": city_id, "endpoint": "heatmap_tcm", "activity_id": act})
            print(f"  ✓ /v1/heatmap -> Activity {act}")
        except Exception as e:
            print(f"  ✗ heatmap error: {e}")

    print("\n" + "=" * 80)
    print(f"🚀 SUBMITTED {len(submitted_tasks)} EXTENDED TASKS. POLLING FOR RESULTS...")
    print("=" * 80)

    for i, task in enumerate(submitted_tasks, 1):
        city_id = task["city_id"]
        ep = task["endpoint"]
        act_id = task["activity_id"]
        print(f"[{i}/{len(submitted_tasks)}] Polling {city_id.upper()} {ep}...")
        result = poll_activity(act_id, timeout=180.0, interval=3.0)
        
        artifact_path = OUTPUT_DIR / city_id / f"{ep}.json"
        with open(artifact_path, "w") as f:
            json.dump(result, f, indent=2)

    print("\n" + "=" * 80)
    print("✅ EXTENDED SIMULATIONS FINISHED!")
    print("=" * 80)

if __name__ == "__main__":
    run_extended()

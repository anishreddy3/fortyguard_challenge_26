# FormaGuard Agent Backend (Google Cloud Run / FastAPI)

Autonomous urban heat-mitigation backend powered by **FastAPI** and **LangGraph** multi-agent loop orchestration.

---

## 🏛️ Architecture & Agent Pipeline

1. **Environmental Sensing Agent (`get_fortyguard_temperature` + `get_osm_canopy`)**:
   - Ingests 3D canvas bounding box from Autodesk Forma.
   - Senses 2-meter street-level microclimate heat index, peak surface temperatures, and solar radiation from FortyGuard.
   - Queries OpenStreetMap / LiDAR to map existing canopy coverage and vegetative deficit zones.

2. **Thermal Risk Analyzer**:
   - Synthesizes composite heat vulnerability index.
   - Flags acute microclimate traps (e.g. unshaded southern pedestrian corridors and reflective plazas).

3. **Spatial Canopy & Albedo Planner**:
   - Generates bioclimatic mitigation strategies (e.g., *"Add 15% tree canopy to the southern corridor"*).
   - Positions species with optimal crown diameter, evapotranspiration rates, and tensile shade sails.

4. **Autodesk Forma Actuator (`forma_design_actuator`)**:
   - Compiles geometry into exact Autodesk Forma Elements SDK element trees (Urns, 4x4 transform matrices, procedural trees, and albedo layers).

---

## 🚀 Google Cloud Run Deployment

### 1. Build and Deploy Container via Google Cloud SDK

```bash
# Set your GCP Project ID
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Build and submit container image to Google Artifact Registry
gcloud builds submit --tag gcr.io/${PROJECT_ID}/formaguard-backend:v1

# Deploy to Google Cloud Run with 300s execution timeout & CORS
gcloud run deploy formaguard-backend \
  --image gcr.io/${PROJECT_ID}/formaguard-backend:v1 \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --timeout 300s \
  --concurrency 80 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars="HOST=0.0.0.0,ALLOWED_ORIGINS=https://formaguard.pages.dev,https://app.autodeskforma.com"
```

### 2. Local Development

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
# Server runs on http://localhost:8080 (Swagger UI at http://localhost:8080/docs)
```

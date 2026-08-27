# FormaGuard Agent Backend (Firebase Hosting → Google Cloud Run / FastAPI)

Autonomous urban heat-mitigation backend powered by **FastAPI** and **LangGraph** multi-agent loop orchestration.

Deployed as a container on **Google Cloud Run**, with **Firebase Hosting** rewriting `/api/**` (and OpenAPI docs) to that service.

---

## Architecture & Agent Pipeline

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

## Local Development

```bash
# From repository root
python -m venv .venv
source .venv/bin/activate
pip install -r agent_backend/requirements.txt
cp .env.example .env   # fill FORTYGUARD_API_KEY / GEMINI_API_KEY

npm run backend:dev
# http://localhost:8080/docs
```

Or from this directory:

```bash
pip install -r requirements.txt
python main.py
```

---

## Deploy to Cloud Run (via Cloud Build)

Build context is the **repository root** so the `fortyguard/` package is included in the image.

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
gcloud config set project ${PROJECT_ID}

# Build + push + deploy (uses cloudbuild.yaml at repo root)
gcloud builds submit --config cloudbuild.yaml

# After first deploy, attach secrets (preferred over plain env vars):
gcloud run services update formaguard-backend \
  --region ${REGION} \
  --update-secrets=FORTYGUARD_API_KEY=FORTYGUARD_API_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest

# Or set env vars directly for a quick smoke test:
gcloud run services update formaguard-backend \
  --region ${REGION} \
  --update-env-vars="FORTYGUARD_API_KEY=...,GEMINI_API_KEY=...,ALLOWED_ORIGINS=https://formaguard.pages.dev,https://app.autodeskforma.com,https://app.autodeskforma.eu"
```

Manual Docker build (optional):

```bash
docker build -f agent_backend/Dockerfile -t formaguard-backend .
```

Health check: `GET /api/health`

---

## Wire Firebase Hosting → Cloud Run

1. Set your Firebase/GCP project in `.firebaserc`.
2. Ensure Cloud Run service name `formaguard-backend` exists in `us-central1` (or edit `firebase.json` / `cloudbuild.yaml` region + `serviceId`).
3. Build the root Vite demo and deploy Hosting:

```bash
# From repository root
npm run build
npx firebase-tools login
npx firebase-tools use your-firebase-project-id
npx firebase-tools deploy --only hosting
```

After deploy:

| URL | Behavior |
|-----|----------|
| `https://PROJECT_ID.web.app/` | Root demo SPA |
| `https://PROJECT_ID.web.app/api/**` | Rewritten to Cloud Run |
| `https://PROJECT_ID.web.app/docs` | FastAPI Swagger via Cloud Run |

Point the Cloudflare Pages extension build env `VITE_AGENT_BACKEND_URL` at `https://PROJECT_ID.web.app` (or the direct `*.run.app` URL).

---

## CORS

`ALLOWED_ORIGINS` is a comma-separated list of **exact** origins (read from the environment). Wildcard hosts (`*.pages.dev`, Forma, Firebase) are covered by `CORS_ORIGIN_REGEX` in `config.py`.

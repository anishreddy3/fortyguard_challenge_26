# FormaGuard

Autonomous urban heat mitigation for **Autodesk Forma**, powered by **FortyGuard** microclimate data and a **LangGraph** multi-agent backend.

FormaGuard senses street-level heat from a 3D design context, plans canopy / shade / albedo interventions, and writes mitigation geometry back into Forma — from a copilot panel inside the Forma iframe, or from a local Web Studio simulator.

---

## Architecture (end to end)

```
Autodesk Forma 3D Studio
        │  iframe panel URL
        ▼
Cloudflare Pages                 Firebase Hosting
forma_extension/                 root Vite Web Studio (dist/)
https://formaguard.pages.dev     https://<project>.web.app
        │                               │
        │  VITE_AGENT_BACKEND_URL       │  /api/** rewrite
        └───────────────┬───────────────┘
                        ▼
              Google Cloud Run
              agent_backend/  (FastAPI + LangGraph + fortyguard/)
                        │
                        ▼
              FortyGuard API  ·  Gemini (optional)
```

| Layer | Path | Platform | Role |
|-------|------|----------|------|
| **Forma extension** | `forma_extension/` | Cloudflare Pages | Embedded iframe copilot; reads canvas bbox, calls `/api/mitigate`, commits Forma Elements |
| **Web Studio** | `src/` | Firebase Hosting | Local/demo simulator: Forma viewport mock, LangGraph inspector, payload explorer |
| **API gateway** | `firebase.json` | Firebase Hosting | Rewrites `/api/**`, `/docs`, `/redoc` → Cloud Run |
| **Agent backend** | `agent_backend/` | Google Cloud Run | FastAPI + LangGraph orchestration, CORS for Pages / Forma / Firebase |
| **FortyGuard SDK** | `fortyguard/` | Bundled in the container | Typed Python client used by agent tools + notebooks |

Full deploy steps live in **[DEPLOY.md](DEPLOY.md)**.

---

## Agent pipeline

1. **Sense** — `get_fortyguard_temperature` + `get_osm_canopy` over the Forma canvas bounding box  
2. **Analyze** — thermal risk / vulnerability scoring  
3. **Plan** — canopy, shade sails, high-albedo surfaces  
4. **Actuate** — `forma_design_actuator` emits Forma Elements SDK payloads (transforms, vegetation, surfaces)

Primary HTTP surface (Cloud Run / Firebase Hosting):

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Liveness / readiness |
| `POST` | `/api/mitigate` | Full LangGraph mitigation loop |
| `POST` | `/api/tools/temperature` | FortyGuard heat sensing only |
| `POST` | `/api/tools/canopy` | Canopy / vegetation gaps |
| `POST` | `/api/tools/actuate` | Format a plan as Forma geometry |
| `GET` | `/docs` | OpenAPI / Swagger |

---

## Repository layout

```
fortyguard_challenge_26/
├── DEPLOY.md                 # Production deploy (Cloud Run → Firebase → Pages → Forma)
├── firebase.json             # Hosting + Cloud Run rewrites
├── .firebaserc               # Firebase / GCP project id
├── cloudbuild.yaml           # Build image + deploy formaguard-backend
├── .env.example              # API keys + CORS + VITE_AGENT_BACKEND_URL
│
├── forma_extension/          # Autodesk Forma panel → Cloudflare Pages
│   ├── wrangler.toml
│   ├── public/_headers       # CSP frame-ancestors for Forma
│   └── src/                  # Copilot UI + backendApi + Forma SDK helpers
│
├── agent_backend/            # FastAPI + LangGraph → Cloud Run
│   ├── Dockerfile            # Build from repo root (-f agent_backend/Dockerfile .)
│   ├── main.py               # Routes + CORS
│   ├── graph.py              # Orchestrator
│   ├── tools.py              # FortyGuard / OSM / Forma actuator
│   └── config.py             # Env-driven settings
│
├── fortyguard/               # Python SDK (in Docker image + notebooks)
├── src/                      # Web Studio (Firebase Hosting public = dist/)
├── notebooks/                # FortyGuard API walkthroughs & use cases
├── data/                     # Sample / cached inputs (mostly gitignored)
└── docs/                     # Design notes + images
```

---

## Prerequisites

- **Node 20+** and npm  
- **Python 3.11+** (local backend)  
- FortyGuard API key (and optional Gemini key for LLM reasoning)  
- For production: `gcloud`, Firebase CLI (`npx firebase-tools`), Cloudflare Wrangler  

---

## Local development

### 1. Environment

```bash
git clone <this-repo> fortyguard_challenge_26
cd fortyguard_challenge_26

cp .env.example .env
# Set FORTYGUARD_API_KEY=...
# Optional: GEMINI_API_KEY=...
# VITE_AGENT_BACKEND_URL=http://localhost:8080
```

### 2. Backend (Cloud Run target)

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r agent_backend/requirements.txt

npm run backend:dev                # http://localhost:8080/docs
```

### 3. Web Studio (Firebase Hosting target)

```bash
npm install
npm run dev                        # http://localhost:3000
```

### 4. Forma extension (Cloudflare Pages target)

```bash
npm run forma:dev                  # http://localhost:5173
```

Point the extension at the local API with `VITE_AGENT_BACKEND_URL=http://localhost:8080` (see `forma_extension/.env.production.example` for production).

### npm scripts

| Script | What it does |
|--------|----------------|
| `npm run dev` | Web Studio on `:3000` |
| `npm run build` | Web Studio → `dist/` (Firebase `hosting.public`) |
| `npm run backend:dev` | FastAPI + reload on `:8080` |
| `npm run backend:deploy` | `gcloud builds submit --config cloudbuild.yaml` |
| `npm run firebase:deploy` | Build Web Studio + deploy Hosting |
| `npm run forma:dev` | Forma extension Vite on `:5173` |
| `npm run forma:build` | Build extension → `forma_extension/dist` |
| `npm run forma:deploy` | Build + Wrangler Pages deploy |

---

## Production deployment

Order matters: **Cloud Run → Firebase Hosting → Cloudflare Pages → register in Forma**.

Detailed commands, project IDs, and verification URLs: **[DEPLOY.md](DEPLOY.md)**.

### Quick path

```bash
# 1) Agent → Cloud Run (build context = repo root so fortyguard/ is included)
gcloud config set project <YOUR_GCP_PROJECT_ID>
gcloud builds submit --config cloudbuild.yaml
# Then attach FORTYGUARD_API_KEY / GEMINI_API_KEY via Secret Manager or env

# 2) Web Studio + /api gateway → Firebase Hosting
# Ensure .firebaserc points at your project
npm run firebase:deploy

# 3) Forma panel → Cloudflare Pages
cd forma_extension
cp .env.production.example .env.production
# VITE_AGENT_BACKEND_URL=https://<YOUR_PROJECT>.web.app
npm run deploy:pages
```

`VITE_AGENT_BACKEND_URL` is a **Vite build-time** variable. Set it in `.env.production` or as a Cloudflare Pages **build** env var — not only in `wrangler.toml` `[vars]`.

### Register in Autodesk Forma

1. Open [Autodesk Forma](https://app.autodeskforma.com) → Extensions → add custom extension  
2. **Panel URL**: `https://formaguard.pages.dev` (or your Pages URL)  
3. Permissions: `geometry:read`, `render:write`, `proposal:read-write`

### CORS

Cloud Run reads `ALLOWED_ORIGINS` (comma-separated **exact** origins). Wildcard hosts (`*.pages.dev`, Forma, Firebase) are covered by `CORS_ORIGIN_REGEX` in `agent_backend/config.py`.

---

## FortyGuard SDK & notebooks

The original Temperature API quickstart still lives in this repo for API exploration and narrative use cases.

```bash
pip install -r requirements.txt   # notebook / SDK deps at repo root
cp .env.example .env              # FORTYGUARD_API_KEY
jupyter lab                       # from repo root
```

| Area | Start here |
|------|------------|
| Client | [`fortyguard/`](fortyguard/) — `FortyGuardClient` submit/poll wrapper |
| Endpoint walkthroughs | [`notebooks/00_setup.ipynb`](notebooks/00_setup.ipynb) → `01`…`05` |
| Use cases | [`notebooks/use_cases/README.md`](notebooks/use_cases/README.md) |

Parcel demos (`parcel_site_due_diligence`, `parcel_portfolio_heat_screening`) ship sample boundaries and cached responses so they can **Run All offline** with no API key.

![San Jose AOI heatmap — daily mean vs. daily peak](docs/images/heatmap_visualized.png)

*Bundled 24-hour heatmap — daily mean (left) and daily peak (right). The same FortyGuard layers feed the FormaGuard agent tools in production.*

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Pages extension calls wrong host / silent local fallback | Set `VITE_AGENT_BACKEND_URL` at **build** time to Firebase Hosting or Cloud Run URL |
| Cloud Run import / missing FortyGuard | Build from **repo root**: `docker build -f agent_backend/Dockerfile .` or use `cloudbuild.yaml` |
| CORS errors from Pages / Forma | Add exact origin to `ALLOWED_ORIGINS`; confirm Pages host matches `CORS_ORIGIN_REGEX` |
| Firebase `/api/**` 404 / 503 | Deploy Cloud Run service `formaguard-backend` in the region in `firebase.json` first; then `firebase deploy --only hosting` |
| `FortyGuardError: No API key` | `.env` at repo root with `FORTYGUARD_API_KEY`, or Secret Manager on Cloud Run |
| Notebook can't import `fortyguard` | Launch Jupyter from the **repo root**, not from `notebooks/` |

---

## License / challenge

Built for the FortyGuard challenge: Autodesk Forma + FortyGuard tOS Enterprise API for defensible urban heat mitigation.

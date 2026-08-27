# FormaGuard Production Deployment Guide

This guide details how to deploy the entire **FormaGuard** ecosystem:
1. **Agent Backend (FastAPI + LangGraph + FortyGuard SDK)** $\rightarrow$ **Google Cloud Run**
2. **Web Studio App & API Gateway** $\rightarrow$ **Firebase Hosting** (with `/api/**` rewrites to Cloud Run)
3. **Autodesk Forma Embedded Extension** $\rightarrow$ **Cloudflare Pages**
4. **Autodesk Forma Portal** $\rightarrow$ Registering the extension URL into Autodesk Forma 3D.

---

## Architecture Overview

```
                        ┌────────────────────────────────────────────────────────┐
                        │              Autodesk Forma 3D Studio                  │
                        │    (Runs embedded panel in iframe via Cloudflare)      │
                        └──────────────────────────┬─────────────────────────────┘
                                                   │ HTTPS
                                                   ▼
┌──────────────────────────────────────┐       ┌─────────────────────────────────┐
│     Cloudflare Pages Frontend        │       │       Firebase Hosting          │
│    (forma_extension / dist)          │       │      (Web Studio / dist)        │
│   https://formaguard.pages.dev       │       │ https://gen-lang-client-0716217362.web.app │
└──────────────────┬───────────────────┘       └────────────────┬────────────────┘
                   │                                            │
                   │ HTTPS API Requests                         │ Rewrites /api/**
                   └───────────────────────┬────────────────────┘
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │     Google Cloud Run Backend           │
                       │    (FastAPI + LangGraph + FortyGuard)  │
                       │   https://formaguard-backend-....run.app│
                       └────────────────────────────────────────┘
```

---

## Prerequisites & Project Credentials

- **GCP Project ID**: `gen-lang-client-0716217362`
- **Region**: `us-central1`
- **FortyGuard API Key**: Set in `.env` or GCP Secret Manager
- **Google Gemini API Key**: Set in `.env` or GCP Secret Manager

---

## 1. Deploy Agent Backend to Google Cloud Run

### Option A: Using Google Cloud Build (Recommended)
From the repository root directory, run:

```bash
# Ensure gcloud is configured with your project
gcloud config set project gen-lang-client-0716217362

# Submit Cloud Build pipeline (builds container and deploys to Cloud Run in us-central1)
gcloud builds submit --config cloudbuild.yaml
```

### Option B: Using Direct Docker & gcloud run deploy
```bash
# 1. Build Docker image
docker build -f agent_backend/Dockerfile -t gcr.io/gen-lang-client-0716217362/formaguard-backend:latest .

# 2. Push to Google Container Registry / Artifact Registry
docker push gcr.io/gen-lang-client-0716217362/formaguard-backend:latest

# 3. Deploy to Cloud Run
gcloud run deploy formaguard-backend \
  --image gcr.io/gen-lang-client-0716217362/formaguard-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars FORTYGUARD_API_KEY="your_api_key",GEMINI_API_KEY="your_gemini_key",HOST=0.0.0.0,PORT=8080
```

Once deployed, copy your Cloud Run Service URL:
`https://formaguard-backend-xxxxxxxxxx-uc.a.run.app`

---

## 2. Deploy Web Studio to Firebase Hosting

Firebase Hosting serves the main FormaGuard Web Studio SPA and automatically proxies all `/api/**` traffic directly to your Google Cloud Run backend.

```bash
# 1. Build the production web bundle
npm run build

# 2. Deploy to Firebase Hosting using the pre-configured firebase.json and .firebaserc
npx -y firebase-tools deploy --only hosting --project gen-lang-client-0716217362
```

Your live Web Studio URL will be:
`https://gen-lang-client-0716217362.web.app` or `https://gen-lang-client-0716217362.firebaseapp.com`

---

## 3. Deploy Autodesk Forma Extension to Cloudflare Pages

The Autodesk Forma embedded extension is located in `forma_extension/`. It is optimized for Cloudflare Pages with iframe CSP headers (`_headers`) and SPA routes (`_routes.json`).

### Step 1: Configure Production Environment
Create `forma_extension/.env.production`:
```bash
VITE_AGENT_BACKEND_URL=https://gen-lang-client-0716217362.web.app
```

### Step 2: Build & Deploy with Wrangler
```bash
# Build the extension bundle
npm run forma:build

# Deploy to Cloudflare Pages
npx -y wrangler pages deploy forma_extension/dist --project-name formaguard
```

### Step 3: Or Deploy via Cloudflare Dashboard (GitHub Integration)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. Select repository `fortyguard_challenge_26`.
3. Configure Build Settings:
   - **Framework preset**: `Vite`
   - **Root directory**: `forma_extension`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Set Environment Variable:
   - `VITE_AGENT_BACKEND_URL` = `https://gen-lang-client-0716217362.web.app`
5. Click **Save and Deploy**.

Your Cloudflare Pages URL:
`https://formaguard.pages.dev`

---

## 4. Register Extension in Autodesk Forma

1. Log in to [Autodesk Forma](https://app.autodeskforma.com).
2. Open any project or create a new urban project.
3. Click the **Extensions** icon on the right sidebar $\rightarrow$ **Developer Mode / Add Custom Extension**.
4. Configure the extension:
   - **Name**: `FormaGuard - Autonomous Urban Heat Mitigation`
   - **Panel URL**: `https://formaguard.pages.dev` (or your Firebase URL)
   - **Scope / Permissions**:
     - `geometry:read` (for reading 3D canvas bounding boxes and topography)
     - `render:write` (for rendering tree canopies and shade meshes)
     - `proposal:read-write` (for saving bioclimatic mitigation layers)
5. Click **Add Extension**. FormaGuard Copilot is now active in Autodesk Forma!

---

## Verification Checklist

| Component | Target Platform | Health / Verification URL |
| :--- | :--- | :--- |
| **Agent Backend** | Google Cloud Run | `https://formaguard-backend-....run.app/api/health` |
| **Microclimate Tool** | Google Cloud Run | `POST /api/tools/temperature` |
| **Web Studio** | Firebase Hosting | `https://gen-lang-client-0716217362.web.app` |
| **Forma Extension** | Cloudflare Pages | `https://formaguard.pages.dev` |
| **Autodesk Forma 3D** | Autodesk Forma App | Embedded right dock iframe |

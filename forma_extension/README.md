# FormaGuard Extension (Cloudflare Pages Frontend)

Frontend extension panel for **Autodesk Forma**, designed to run inside the Forma embedded iframe and talk to the Firebase Hosting → Cloud Run backend.

---

## Features

- **Forma Embedded SDK Integration**: Extracts current 3D canvas coordinates (`getFormaCanvasBoundingBox`), proposal bounds, and camera views.
- **Agent Copilot Chat**: Connects to the LangGraph multi-agent backend to trigger thermal risk assessments and view agent thought steps.
- **Forma Geometry Actuator**: Pushes generated 3D trees (`vegetation_tree`), tensile shade sails (`shade_structure`), and high-albedo pavements (`surface_albedo_layer`) directly onto the active Forma proposal.
- **Cloudflare Pages**: `_headers` (CSP `frame-ancestors` for Forma), SPA `_redirects` / `_routes.json`, and `wrangler.toml`.

---

## Environment (build-time)

Vite inlines `VITE_*` at **build** time. Set the backend URL before building:

```bash
cp .env.production.example .env.production
# Edit VITE_AGENT_BACKEND_URL → https://YOUR_FIREBASE_PROJECT_ID.web.app
#                            or → https://formaguard-backend-….run.app
```

For Cloudflare dashboard / CI builds, add **Build environment variable**:

| Name | Example |
|------|---------|
| `VITE_AGENT_BACKEND_URL` | `https://YOUR_FIREBASE_PROJECT_ID.web.app` |

Do **not** put `VITE_AGENT_BACKEND_URL` only in `wrangler.toml` `[vars]` — that is runtime-only and will not reach the static JS bundle.

---

## Deploy to Cloudflare Pages

### CLI (Wrangler)

```bash
npm install
cp .env.production.example .env.production   # set VITE_AGENT_BACKEND_URL
npm run deploy:pages
```

### Cloudflare dashboard (Git)

| Setting | Value |
|---------|--------|
| Root directory | `forma_extension` |
| Build command | `npm run build` |
| Build output | `dist` |
| Env var | `VITE_AGENT_BACKEND_URL` = Firebase Hosting or Cloud Run URL |

---

## Register Extension in Autodesk Forma

1. Log in to [Autodesk Forma](https://app.autodeskforma.com).
2. Go to **Extensions & Integrations** → **Developer Tools** → **Add Custom Extension**.
3. Set **Panel URL** to your Cloudflare Pages URL: `https://formaguard.pages.dev`.
4. Configure required permissions:
   - `geometry:read` (for 3D bounding box extraction)
   - `render:write` (for adding tree canopy & shade geometry)
   - `proposal:read-write` (for saving mitigation element trees)
5. Open any 3D urban project in Autodesk Forma; the FormaGuard copilot panel will appear in the right-side extension dock.

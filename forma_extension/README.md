# FormaGuard Extension (Cloudflare Pages Frontend)

Frontend extension panel for **Autodesk Forma**, designed to run inside the Forma embedded iframe.

---

## 🛠️ Features

- **Forma Embedded SDK Integration**: Extracts current 3D canvas coordinates (`getFormaCanvasBoundingBox`), proposal bounds, and camera views.
- **Agent Copilot Chat**: Connects to the LangGraph multi-agent backend to trigger thermal risk assessments and view agent thought steps.
- **Forma Geometry Actuator**: Pushes generated 3D trees (`vegetation_tree`), tensile shade sails (`shade_structure`), and high-albedo pavements (`surface_albedo_layer`) directly onto the active Forma proposal.
- **Optimized for Cloudflare Pages**: Pre-configured headers for iframe embedding (`frame-ancestors https://app.autodeskforma.com`), SPA routing `_routes.json`, and `wrangler.toml`.

---

## 🌐 Deploy to Cloudflare Pages

### 1. Build and Deploy via Cloudflare Wrangler CLI

```bash
# Install dependencies
npm install

# Build static assets for production
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name formaguard
```

### 2. Register Extension in Autodesk Forma Developer Portal

1. Log in to [Autodesk Forma](https://app.autodeskforma.com).
2. Go to **Extensions & Integrations** → **Developer Tools** → **Add Custom Extension**.
3. Set **Panel URL** to your Cloudflare Pages URL: `https://formaguard.pages.dev`.
4. Configure required permissions:
   - `geometry:read` (for 3D bounding box extraction)
   - `render:write` (for adding tree canopy & shade geometry)
   - `proposal:read-write` (for saving mitigation element trees)
5. Open any 3D urban project in Autodesk Forma; the FormaGuard copilot panel will appear in the right-side extension dock.

# ==============================================================================
# FormaGuard Agent Backend - Production Dockerfile for Google Cloud Run
# ==============================================================================
# Build from the repository root (required so the fortyguard package is included):
#
#   docker build -f agent_backend/Dockerfile -t formaguard-backend .
#   gcloud builds submit --config cloudbuild.yaml
#
# Multi-stage build: FastAPI + LangGraph, Gunicorn/Uvicorn, non-root, port 8080.
# ==============================================================================

FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY agent_backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ==============================================================================
# Final Runner Stage
# ==============================================================================
FROM python:3.11-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    APP_HOME=/app/agent_backend \
    PYTHONPATH=/app

WORKDIR /app

COPY --from=builder /install /usr/local

RUN groupadd -r formaguard && useradd -r -g formaguard -d /app -s /sbin/nologin formaguard

# Layout: /app/fortyguard + /app/agent_backend (matches local repo import paths)
COPY fortyguard/ /app/fortyguard/
COPY agent_backend/ /app/agent_backend/

RUN chown -R formaguard:formaguard /app
USER formaguard

WORKDIR $APP_HOME

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ.get('PORT', '8080') + '/api/health')" || exit 1

# Gunicorn + Uvicorn workers:
# - timeout 300s for multi-agent LangGraph loops
# - logs to stdout for Cloud Logging
CMD exec gunicorn \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers ${WEB_CONCURRENCY:-2} \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 300 \
    --graceful-timeout 30 \
    --keep-alive 65 \
    --access-logfile - \
    --error-logfile - \
    main:app

# ==============================================================================
# FormaGuard Agent Backend - Production Dockerfile for Google Cloud Run
# ==============================================================================
# Multi-stage optimized build for Python FastAPI + LangGraph Orchestration.
# Uses Gunicorn with Uvicorn workers, non-root execution, and 300s timeout.
# ==============================================================================

FROM python:3.11-slim AS builder

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install build dependencies if needed for C-extensions (shapely, numpy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies to user wheel cache
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt


# ==============================================================================
# Final Runner Stage
# ==============================================================================
FROM python:3.11-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    APP_HOME=/app

WORKDIR $APP_HOME

# Copy installed wheels and dependencies from builder stage
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Create non-root application user for Cloud Run container security
RUN groupadd -r formaguard && useradd -r -g formaguard -d $APP_HOME -s /sbin/nologin formaguard

# Copy application source code
COPY . $APP_HOME/

# Set ownership
RUN chown -R formaguard:formaguard $APP_HOME
USER formaguard

# Google Cloud Run default ingress port is 8080
EXPOSE 8080

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:' + str(os.environ.get('PORT', 8080)) + '/api/health')" || exit 1

# Launch Gunicorn with Uvicorn workers:
# - workers: 2-4 (scales with Cloud Run vCPU)
# - timeout: 300s (prevents edge-worker timeouts during multi-agent LangGraph loops)
# - graceful-timeout: 30s
# - accesslog / errorlog to stdout for Cloud Logging
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

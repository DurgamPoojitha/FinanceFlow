# ============================================================
# FinanceFlow BI Platform – Dockerfile
# Multi-stage build for a lean production image.
# ============================================================

# Stage 1: Build stage – install dependencies with pip
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build tools needed for some packages (bcrypt, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# Stage 2: Runtime stage – minimal image
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY backend/ ./backend/
COPY etl/ ./etl/
COPY database/ ./database/

# Optional: copy pre-built frontend static files
# Uncomment this if you build the frontend and want monorepo serving:
# COPY dist/ ./dist/

# Create a non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser /app
USER appuser

# Expose the API port
EXPOSE 8000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Initialize DB and start the API server
CMD ["sh", "-c", "python database/init_db.py && uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 1"]

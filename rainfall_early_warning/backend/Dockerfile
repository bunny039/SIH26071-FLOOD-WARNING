# -- AquaSentinel Backend - Railway Dockerfile --------------------------------
# Build context is the REPO ROOT (SIH26071-FLOOD-WARNING-main/)
FROM python:3.11-slim

# System deps for netCDF4 / scipy / matplotlib
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libhdf5-dev \
        libnetcdf-dev \
        pkg-config \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements (relative to repo root)
COPY rainfall_early_warning/requirements.txt .

# Install CPU-only torch (saves ~1.5 GB vs CUDA)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install remaining deps
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full rainfall_early_warning subfolder into /app
COPY rainfall_early_warning/ ./rainfall_early_warning/

# Set working dir to the project root so Python imports work
WORKDIR /app/rainfall_early_warning

EXPOSE 8000

CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}

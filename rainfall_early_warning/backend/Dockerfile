# -- AquaSentinel Backend — Railway Dockerfile ------------------------------
# Uses slim Python base; installs CPU-only PyTorch to keep image size down.
FROM python:3.11-slim

# System deps needed by netCDF4 / scipy / matplotlib
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libhdf5-dev \
        libnetcdf-dev \
        pkg-config \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (layer caching)
COPY requirements.txt .

# Install CPU-only torch (saves ~1.5 GB vs CUDA build)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install remaining deps
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project (backend + ml + config + data files)
COPY . .

# Expose the port Railway will forward to
EXPOSE 8000

# Run with uvicorn; $PORT is injected by Railway at runtime
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}

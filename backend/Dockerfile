FROM python:3.10-slim

# Install system dependencies for cairo and pycairo first,
# so pkg-config can locate cairo when pip compiles pycairo.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libcairo2 \
    libcairo2-dev \
    libpango-1.0-0 \
    libpango1.0-dev \
    libglib2.0-0 \
    libglib2.0-dev \
    libffi-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Create and activate a virtual environment
RUN python -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy application code
COPY . .

# Crear directorio de archivos estáticos para evitar warning de WhiteNoise al iniciar
RUN mkdir -p staticfiles

CMD gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --preload --log-level debug --access-logfile - --error-logfile -

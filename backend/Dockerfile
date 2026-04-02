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

# Create and activate a virtual environment
RUN python -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy application code
COPY . .

# Recolectar archivos estáticos en tiempo de build
RUN DJANGO_SETTINGS_MODULE=config.settings.prod \
    SECRET_KEY=dummy-secret-key-for-collectstatic \
    DATABASE_URL=sqlite:///tmp/build.db \
    python manage.py collectstatic --noinput

CMD gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2

#!/bin/sh
set -e

echo "=== optic-ar backend starting on PORT=$PORT ==="

python manage.py migrate --no-input
python manage.py collectstatic --no-input

exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:$PORT" \
    --workers 2 \
    --log-level debug \
    --access-logfile - \
    --error-logfile -

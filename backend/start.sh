#!/bin/bash
set -e

echo "Running Alembic migrations..."
python -m alembic upgrade head

if [ "$SEED_ON_BOOT" = "true" ]; then
    echo "SEED_ON_BOOT is true. Running database seeder..."
    python -m app.seed.seed_data
else
    echo "Skipping database seed."
fi

echo "Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

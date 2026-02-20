#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until python -c "
import socket, sys, os
url = os.environ.get('DATABASE_URL', '')
# Parse host from DATABASE_URL: ...://user:pass@HOST:PORT/db
try:
    at_part = url.split('@')[1]
    host = at_part.split(':')[0]
    port = int(at_part.split(':')[1].split('/')[0])
except Exception:
    host, port = 'db', 5432
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
try:
    s.connect((host, port))
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
"; do
  echo "  ...waiting"
  sleep 2
done
echo "PostgreSQL is ready."

echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
exec "$@"

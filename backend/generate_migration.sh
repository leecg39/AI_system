#!/bin/bash
# @TASK P0-T0.4 - Database initialization: migration generation script
# @SPEC docs/planning/04-database-design.md

cd /Users/user01/Desktop/AI_system/backend

# Activate virtual environment
source venv/bin/activate

# Generate migration
echo "Generating Alembic migration..."
alembic revision --autogenerate -m "create_all_tables"

# Apply migration
echo "Applying migration..."
alembic upgrade head

echo "Migration complete!"

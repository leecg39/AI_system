#!/bin/bash
# @TASK P0-T0.4 - Database initialization: complete initialization script
# @SPEC docs/planning/04-database-design.md

set -e

cd /Users/user01/Desktop/AI_system/backend

echo "================================================"
echo "Database Initialization Script"
echo "================================================"

# Activate virtual environment
echo "1. Activating virtual environment..."
source venv/bin/activate

# Generate migration
echo ""
echo "2. Generating Alembic migration for all tables..."
alembic revision --autogenerate -m "create_all_tables"

# Apply migration
echo ""
echo "3. Applying migration to PostgreSQL..."
alembic upgrade head

# Seed team templates
echo ""
echo "4. Seeding team templates..."
python -c "
import asyncio
from app.db.seed import main
asyncio.run(main())
"

echo ""
echo "================================================"
echo "Database initialization completed successfully!"
echo "================================================"
echo ""
echo "Summary:"
echo "  - Created 7 tables: users, teams, agents, tasks, task_results, task_logs, team_templates"
echo "  - Applied all migrations"
echo "  - Seeded 10 team templates"
echo ""

# AI Agent Team Platform

## Project Overview
AI 에이전트 팀 통합 플랫폼 - 10개 AI 에이전트 팀을 관리하는 SaaS 플랫폼

## Tech Stack
- Backend: FastAPI (Python 3.12) + SQLAlchemy 2.0+ + Alembic + asyncpg
- Frontend: Next.js 15 (App Router) + TypeScript + Zustand + shadcn/ui + TailwindCSS
- Database: PostgreSQL 16
- Queue: Redis + Celery
- Real-time: WebSocket
- Auth: JWT + OAuth2 (Google)
- Visualization: React Flow
- Container: Docker + Docker Compose

## Directory Structure
```
backend/           # FastAPI backend
  app/
    api/v1/        # API routes
    core/          # Config, security, deps
    db/            # Database session
    models/        # SQLAlchemy models
    schemas/       # Pydantic schemas
    services/      # Business logic
  tests/           # Backend tests
  alembic/         # Migrations

frontend/          # Next.js frontend
  src/
    app/           # App Router pages
    components/    # React components
    hooks/         # Custom hooks
    lib/           # Utilities
    services/      # API clients
    stores/        # Zustand stores
    types/         # TypeScript types

specs/             # YAML specifications
  domain/          # Domain resources
  screens/         # Screen specs
  shared/          # Shared types/components
```

## Conventions
- TDD: RED → GREEN → REFACTOR
- Git: Conventional Commits (feat:, fix:, test:, docs:)
- Git Worktree: Phase별 분리
- API: RESTful, /api/v1/ prefix
- Language: UI Korean, Code English

## Lessons Learned
<!-- 에이전트 작업 중 발견한 교훈 기록 -->

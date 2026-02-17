# Project: AI Agent Team Platform

## Overview
- AI 에이전트 팀 통합 플랫폼 (10개 팀 관리)
- 1인 사업자 내부 도구 + 향후 SaaS 전환
- Claude API 기반 멀티 에이전트 시스템

## Tech Stack
- Backend: FastAPI (Python 3.12) + SQLAlchemy 2.0+ + Alembic
- Frontend: Next.js 15 (App Router) + TypeScript + Zustand + shadcn/ui
- Database: PostgreSQL 16
- Queue: Redis + Celery
- Real-time: WebSocket
- Auth: JWT + OAuth2 (Google)
- Visualization: React Flow (org chart)
- Container: Docker + Docker Compose

## Key Screens (10)
1. Login / Signup
2. Dashboard (org chart view)
3. Team Detail (agent hierarchy)
4. Task Request (3-step wizard)
5. Task Monitor (real-time WebSocket)
6. Task Results (preview + download)
7. Team Create (template-based)
8. Task History (table + filters)
9. Settings (profile, API, subscription)

## Domain Resources (8)
users, teams, agents, tasks, task_results, task_logs, team_templates, dashboard_stats

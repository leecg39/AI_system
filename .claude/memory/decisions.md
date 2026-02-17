# Architecture Decisions

## 2026-02-17: Tech Stack Selection
- FastAPI chosen for async + Python ecosystem (Claude SDK)
- Next.js 15 chosen for SSR + App Router maturity
- PostgreSQL for JSONB support (agent config, task options)
- Redis + Celery for AI task queue (long-running)
- WebSocket for real-time task monitoring

## 2026-02-17: Multi-Agent Architecture
- 4-layer structure: Orchestrator → Director → Agent → QA
- Teams are configurable via templates
- Agent status tracked in real-time via WebSocket

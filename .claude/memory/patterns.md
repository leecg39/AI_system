# Patterns & Conventions

## Backend
- FastAPI dependency injection
- Pydantic v2 schemas (validation)
- SQLAlchemy async session
- Alembic migrations (auto-generate)
- Service layer pattern (routes → services → repositories)

## Frontend
- App Router (Next.js 15)
- Server Components by default
- Client Components with "use client" only when needed
- Zustand for global state
- TanStack Query for server state
- shadcn/ui for UI components

## API Design
- RESTful endpoints
- /api/v1/ prefix
- JWT Bearer token auth
- Standard error response format

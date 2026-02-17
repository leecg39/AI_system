# TRD (Technical Requirements Document)

## 1. 기술 스택 요약

### 결정 방식
- 사용자 레벨: L2
- 결정 방식: AI 추천 수락

### 1.1 프론트엔드
| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | SSR/SSG 지원, SaaS SEO 유리 |
| UI 라이브러리 | Tailwind CSS + shadcn/ui | 빠른 UI 개발, 일관된 디자인 |
| 상태 관리 | Zustand | 경량, 간단한 API |
| 실시간 통신 | WebSocket (native) | 에이전트 상태 실시간 업데이트 |
| 조직도 시각화 | React Flow | 인터랙티브 노드 그래프 |
| 차트/그래프 | Recharts | 작업 통계 시각화 |

### 1.2 백엔드
| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | FastAPI (Python 3.12) | AI 에이전트 연동, 비동기 지원 |
| 비동기 작업 | Celery + Redis | 에이전트 작업 큐 관리 |
| WebSocket | FastAPI WebSocket | 실시간 상태 전송 |
| AI API | Anthropic SDK (Claude) | 핵심 AI 엔진 |
| 인증 | JWT + OAuth2 | 보안 표준 |

### 1.3 데이터베이스
| 항목 | 선택 | 이유 |
|------|------|------|
| 메인 DB | PostgreSQL 16 | 관계형 데이터, 안정성 |
| 캐시/큐 | Redis | Celery 브로커, 세션 캐시 |
| 파일 저장 | S3 호환 스토리지 | 결과물 파일 저장 |

### 1.4 인프라
| 항목 | 선택 | 이유 |
|------|------|------|
| 배포 | Docker + Docker Compose | 개발/배포 일관성 |
| 호스팅 | Vercel (FE) + Railway/Fly.io (BE) | 빠른 배포, 비용 효율 |
| CI/CD | GitHub Actions | 자동 테스트/배포 |

---

## 2. 시스템 아키텍처

```
[Browser] ← WebSocket → [Next.js Frontend]
                              ↓ REST API
                         [FastAPI Backend]
                         ↙        ↓        ↘
                   [PostgreSQL] [Redis] [S3 Storage]
                                  ↓
                            [Celery Workers]
                                  ↓
                          [Claude API (Anthropic)]
```

---

## 3. API 설계 (주요 엔드포인트)

### 팀 관리
- `GET /api/teams` - 전체 팀 목록
- `POST /api/teams` - 팀 생성 (템플릿 기반)
- `GET /api/teams/{id}` - 팀 상세
- `PUT /api/teams/{id}` - 팀 수정
- `DELETE /api/teams/{id}` - 팀 삭제

### 에이전트 관리
- `GET /api/teams/{id}/agents` - 팀 내 에이전트 목록
- `POST /api/teams/{id}/agents` - 에이전트 추가
- `PUT /api/agents/{id}` - 에이전트 수정
- `DELETE /api/agents/{id}` - 에이전트 삭제

### 작업 관리
- `POST /api/tasks` - 작업 요청
- `GET /api/tasks/{id}` - 작업 상태 조회
- `GET /api/tasks/{id}/result` - 결과물 조회
- `POST /api/tasks/{id}/feedback` - 수정 요청
- `GET /api/tasks/history` - 작업 이력

### 실시간
- `WS /ws/tasks/{id}` - 작업 진행 실시간 스트림

---

## 4. 데이터 모델 (핵심)

### User
- id, email, password_hash, name, plan, created_at

### Team
- id, user_id, name, description, template_id, config(JSON), created_at

### Agent
- id, team_id, name, role, model(sonnet/haiku), prompt_template, order, created_at

### Task
- id, team_id, user_id, type, input(JSON), options(JSON), status, started_at, completed_at

### TaskResult
- id, task_id, agent_id, content, file_url, quality_score, created_at

### TeamTemplate
- id, name, description, category, default_agents(JSON), created_at

---

## 5. 비기능 요구사항

| 항목 | 목표 |
|------|------|
| 응답 시간 | API < 200ms, 페이지 로드 < 2s |
| WebSocket 안정성 | 99.9% uptime |
| 동시 작업 | 사용자당 5개 병렬 작업 |
| 데이터 보존 | 작업 이력 90일 보관 |
| 보안 | JWT 인증, HTTPS, API 키 암호화 |

---

## 6. Decision Log

| 결정 | 대안 | 선택 이유 |
|------|------|----------|
| Next.js | React + Vite | SSR 필요 (SaaS SEO), 풀스택 가능 |
| FastAPI | Django, Express | Python AI 생태계, 비동기 성능 |
| PostgreSQL | MySQL, MongoDB | 관계형 데이터 적합, JSON 지원 |
| Celery | Dramatiq, Huey | 생태계 크기, 안정성 |
| React Flow | D3.js, vis.js | React 네이티브, 인터랙션 우수 |

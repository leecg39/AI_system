# Coding Convention

## 1. 프로젝트 구조

### 프론트엔드 (Next.js)
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (main)/
│   │   ├── dashboard/page.tsx
│   │   ├── teams/
│   │   │   ├── [id]/page.tsx
│   │   │   ├── [id]/tasks/new/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── tasks/
│   │   │   ├── [id]/monitor/page.tsx
│   │   │   ├── [id]/results/page.tsx
│   │   │   └── history/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/              # shadcn/ui 기본 컴포넌트
│   ├── layout/          # Sidebar, Header 등
│   ├── team/            # TeamCard, TeamOrgChart 등
│   ├── agent/           # AgentCard, AgentStatusCard 등
│   ├── task/            # TaskForm, TaskMonitor 등
│   └── common/          # 공통 컴포넌트
├── lib/
│   ├── api.ts           # API 클라이언트
│   ├── ws.ts            # WebSocket 클라이언트
│   └── utils.ts
├── stores/
│   └── useStore.ts      # Zustand 스토어
└── types/
    └── index.ts         # TypeScript 타입 정의
```

### 백엔드 (FastAPI)
```
backend/
├── app/
│   ├── main.py          # FastAPI 앱 엔트리
│   ├── config.py        # 설정
│   ├── models/          # SQLAlchemy 모델
│   │   ├── user.py
│   │   ├── team.py
│   │   ├── agent.py
│   │   └── task.py
│   ├── schemas/         # Pydantic 스키마
│   ├── api/
│   │   ├── auth.py
│   │   ├── teams.py
│   │   ├── agents.py
│   │   ├── tasks.py
│   │   └── ws.py        # WebSocket 엔드포인트
│   ├── services/
│   │   ├── team_service.py
│   │   ├── agent_service.py
│   │   ├── task_service.py
│   │   └── ai_service.py  # Claude API 연동
│   ├── workers/
│   │   └── task_worker.py  # Celery 워커
│   └── utils/
├── alembic/             # DB 마이그레이션
├── tests/
└── requirements.txt
```

---

## 2. 네이밍 컨벤션

### TypeScript (Frontend)
| 대상 | 스타일 | 예시 |
|------|--------|------|
| 컴포넌트 | PascalCase | `AgentStatusCard` |
| 함수 | camelCase | `fetchTeamData` |
| 변수 | camelCase | `teamList` |
| 상수 | UPPER_SNAKE | `MAX_AGENTS_PER_TEAM` |
| 타입/인터페이스 | PascalCase | `TeamResponse` |
| 파일 (컴포넌트) | PascalCase | `AgentStatusCard.tsx` |
| 파일 (유틸리티) | camelCase | `apiClient.ts` |

### Python (Backend)
| 대상 | 스타일 | 예시 |
|------|--------|------|
| 클래스 | PascalCase | `TeamService` |
| 함수/메서드 | snake_case | `create_team` |
| 변수 | snake_case | `team_list` |
| 상수 | UPPER_SNAKE | `MAX_AGENTS_PER_TEAM` |
| 모듈/파일 | snake_case | `team_service.py` |

---

## 3. Git 컨벤션

### 브랜치 전략
```
main          - 프로덕션
├── develop   - 개발 통합
├── feat/*    - 기능 개발
├── fix/*     - 버그 수정
└── hotfix/*  - 긴급 수정
```

### 커밋 메시지
```
<type>(<scope>): <description>

type: feat, fix, refactor, style, docs, test, chore
scope: frontend, backend, db, infra, common
```

예시:
```
feat(frontend): 팀 조직도 뷰 구현
fix(backend): WebSocket 연결 끊김 문제 수정
refactor(backend): 에이전트 서비스 레이어 분리
```

---

## 4. API 컨벤션

- RESTful URL: `/api/v1/teams/{id}/agents`
- HTTP 메서드: GET(조회), POST(생성), PUT(수정), DELETE(삭제)
- 응답 형식:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 100 }
}
```
- 에러 형식:
```json
{
  "success": false,
  "error": {
    "code": "TEAM_NOT_FOUND",
    "message": "팀을 찾을 수 없습니다."
  }
}
```

---

## 5. 코드 품질

### 린팅/포맷팅
- Frontend: ESLint + Prettier
- Backend: ruff (linter + formatter)

### 테스트
- Frontend: Vitest + React Testing Library
- Backend: pytest + httpx

### 필수 체크
- TypeScript strict mode
- Python type hints 필수
- API 엔드포인트 테스트 커버리지 80% 이상

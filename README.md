# AI Agent Team Platform

AI 에이전트 팀 통합 플랫폼 - 10개 AI 에이전트 팀을 관리하는 SaaS 플랫폼

## Tech Stack

- **Backend**: FastAPI (Python 3.12) + SQLAlchemy 2.0+ + Alembic + asyncpg
- **Frontend**: Next.js 15 (App Router) + TypeScript + Zustand + shadcn/ui + TailwindCSS
- **Database**: PostgreSQL 16 (production), SQLite (development)
- **Queue**: Redis + Celery
- **Real-time**: WebSocket
- **Auth**: JWT + OAuth2 (Google)
- **Visualization**: React Flow
- **Container**: Docker + Docker Compose

## Environment Setup

이 프로젝트는 세 가지 환경을 지원합니다:

### 1. Development (로컬 개발)

SQLite를 사용하여 외부 의존성 없이 빠르게 개발할 수 있습니다.

```bash
# Backend 환경변수 설정
cd backend
cp .env.example .env.development

# 환경변수 편집 (필요한 경우)
# APP_ENV=development
# DATABASE_URL=sqlite+aiosqlite:///./app.db

# Python 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 마이그레이션
alembic upgrade head

# 개발 서버 실행
uvicorn app.main:app --reload
```

```bash
# Frontend 설정 및 실행
cd frontend
npm install
npm run dev
```

### 2. Production (프로덕션 배포)

PostgreSQL과 Redis를 사용하는 프로덕션 환경입니다.

```bash
# Backend 환경변수 설정
cd backend
cp .env.example .env.production

# 반드시 수정해야 할 항목:
# - APP_ENV=production
# - DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DATABASE
# - SECRET_KEY=<랜덤한 긴 문자열>
# - OPENAI_API_KEY=sk-your-real-api-key
# - CORS_ORIGINS=["https://yourdomain.com"]

# 환경변수 로드 후 실행
export APP_ENV=production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Docker (컨테이너 배포)

Docker Compose로 전체 스택을 한 번에 실행합니다.

```bash
# 프로젝트 루트에 .env.docker 생성
cp backend/.env.example .env.docker

# 필요한 환경변수 수정:
# - OPENAI_API_KEY=sk-your-api-key
# - SECRET_KEY=<production-secret-key>

# Docker Compose 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 중지
docker-compose down
```

서비스 접근:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Nginx: http://localhost:80

## Environment Variables Reference

### Core Settings

| Variable | Development | Production | Docker | Description |
|----------|-------------|------------|--------|-------------|
| `APP_ENV` | development | production | docker | 환경 선택 |
| `DATABASE_URL` | sqlite+aiosqlite:///./app.db | postgresql+asyncpg://... | postgresql+asyncpg://postgres:postgres@db:5432/app | 데이터베이스 연결 |
| `SECRET_KEY` | dev-key | **MUST CHANGE** | **MUST CHANGE** | JWT 서명 키 |
| `OPENAI_API_KEY` | sk-test-key | sk-real-key | sk-real-key | OpenAI API 키 |
| `CORS_ORIGINS` | ["http://localhost:3000"] | ["https://yourdomain.com"] | ["http://localhost:3000"] | 허용된 오리진 |

### Optional Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | redis://localhost:6379/0 | Redis 연결 URL |
| `CELERY_BROKER_URL` | redis://localhost:6379/0 | Celery 브로커 |
| `CELERY_RESULT_BACKEND` | redis://localhost:6379/1 | Celery 결과 백엔드 |
| `DEBUG` | false | 디버그 모드 |

## Development Workflow

### 1. 데이터베이스 마이그레이션

```bash
cd backend

# 새 마이그레이션 생성
alembic revision --autogenerate -m "Description"

# 마이그레이션 적용
alembic upgrade head

# 롤백
alembic downgrade -1
```

### 2. 테스트 실행

```bash
# Backend 테스트
cd backend
pytest tests/ -v

# Frontend 테스트
cd frontend
npm test
```

### 3. 코드 포맷팅

```bash
# Backend (Black + isort)
cd backend
black app/ tests/
isort app/ tests/

# Frontend (Prettier)
cd frontend
npm run lint
npm run format
```

## Project Structure

```
.
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/         # API 라우트
│   │   ├── core/           # 설정, 보안, 의존성
│   │   ├── db/             # 데이터베이스 세션
│   │   ├── models/         # SQLAlchemy 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   └── services/       # 비즈니스 로직
│   ├── tests/              # 백엔드 테스트
│   ├── alembic/            # 데이터베이스 마이그레이션
│   ├── .env.development    # 개발 환경변수
│   └── .env.production     # 프로덕션 환경변수
├── frontend/               # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/           # App Router 페이지
│   │   ├── components/    # React 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── lib/           # 유틸리티
│   │   ├── services/      # API 클라이언트
│   │   ├── stores/        # Zustand 스토어
│   │   └── types/         # TypeScript 타입
│   └── public/            # 정적 파일
├── .env.docker            # Docker 환경변수
├── docker-compose.yml     # Docker Compose 설정
└── README.md             # 이 파일

```

## Security Notes

### 프로덕션 배포 전 체크리스트

- [ ] `SECRET_KEY`를 랜덤한 긴 문자열로 변경
- [ ] `OPENAI_API_KEY`에 실제 API 키 설정
- [ ] `CORS_ORIGINS`를 실제 도메인으로 제한
- [ ] `DEBUG=false` 설정
- [ ] PostgreSQL 비밀번호 변경
- [ ] HTTPS 설정
- [ ] 환경변수 파일 (.env.*) Git에 커밋하지 않기 (.gitignore에 추가됨)

## Troubleshooting

### SQLite 사용 시 주의사항

SQLite는 개발용으로만 사용하세요. 프로덕션에서는 반드시 PostgreSQL을 사용해야 합니다.

```bash
# 개발 환경에서 SQLite 사용
APP_ENV=development uvicorn app.main:app --reload
```

### Docker 빌드 실패

```bash
# 캐시 없이 재빌드
docker-compose build --no-cache

# 볼륨 삭제 후 재시작
docker-compose down -v
docker-compose up -d
```

### 포트 충돌

다른 서비스가 포트를 사용 중이면 `.env.docker`에서 포트를 변경하세요:

```bash
BACKEND_PORT=8001
FRONTEND_PORT=3001
NGINX_PORT=8080
```

## License

MIT License

## Contact

For issues and questions, please open an issue on GitHub.

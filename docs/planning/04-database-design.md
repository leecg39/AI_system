# Database Design

## 1. ERD (Entity Relationship Diagram)

```
[User] 1──N [Team] 1──N [Agent]
  │                │
  │                │
  └──N [Task] N──1─┘
         │
         1──N [TaskResult]
         │
         1──N [TaskLog]

[TeamTemplate] 1──N [Team]
```

---

## 2. 테이블 상세

### users
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| name | VARCHAR(100) | |
| plan | ENUM('free','pro','enterprise') | DEFAULT 'free' |
| api_usage_count | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

### teams
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | |
| template_id | UUID | FK → team_templates, NULLABLE |
| config | JSONB | 팀 설정 (아이콘, 색상 등) |
| status | ENUM('active','paused','archived') | DEFAULT 'active' |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

### agents
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| name | VARCHAR(100) | NOT NULL |
| role | VARCHAR(200) | 에이전트 역할 설명 |
| layer | ENUM('orchestration','research','execution','quality') | 계층 |
| model | ENUM('opus','sonnet','haiku') | Claude 모델 |
| prompt_template | TEXT | 시스템 프롬프트 |
| tools | JSONB | 사용 가능 도구 목록 |
| sort_order | INTEGER | 표시 순서 |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

### tasks
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| user_id | UUID | FK → users |
| type | VARCHAR(50) | 작업 유형 (content, analysis, report) |
| input | JSONB | 입력 데이터 (URL, 텍스트, 파일 경로) |
| options | JSONB | 선택 옵션 (출력 유형, 설정 등) |
| status | ENUM('pending','running','completed','failed','cancelled') | |
| progress | INTEGER | 0-100 진행률 |
| started_at | TIMESTAMP | |
| completed_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT NOW() |

### task_results
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| task_id | UUID | FK → tasks |
| agent_id | UUID | FK → agents |
| result_type | VARCHAR(50) | blog, sns, newsletter, report 등 |
| content | TEXT | 생성된 텍스트 콘텐츠 |
| file_url | VARCHAR(500) | S3 파일 URL (이미지, PDF 등) |
| metadata | JSONB | 추가 메타데이터 |
| quality_score | FLOAT | QA 에이전트 품질 점수 |
| version | INTEGER | 수정 버전 (1, 2, 3...) |
| created_at | TIMESTAMP | DEFAULT NOW() |

### task_logs
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| task_id | UUID | FK → tasks |
| agent_id | UUID | FK → agents |
| status | ENUM('started','processing','completed','error') | |
| message | TEXT | 진행 메시지 |
| progress | INTEGER | 에이전트별 진행률 |
| created_at | TIMESTAMP | DEFAULT NOW() |

### team_templates
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| name | VARCHAR(100) | 마케팅 팀, 재무 팀 등 |
| description | TEXT | 템플릿 설명 |
| category | VARCHAR(50) | marketing, finance, strategy 등 |
| icon | VARCHAR(50) | 아이콘 이름 |
| default_agents | JSONB | 기본 에이전트 구성 |
| is_active | BOOLEAN | DEFAULT TRUE |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 3. 인덱스

```sql
-- 자주 조회되는 쿼리 최적화
CREATE INDEX idx_teams_user_id ON teams(user_id);
CREATE INDEX idx_agents_team_id ON agents(team_id);
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_results_task_id ON task_results(task_id);
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_created_at ON task_logs(created_at);
```

---

## 4. 기본 팀 템플릿 시드 데이터

### 마케팅 팀
```json
{
  "name": "마케팅 팀",
  "category": "marketing",
  "default_agents": [
    {"name": "content_director", "role": "전체 콘텐츠 전략 수립", "layer": "orchestration", "model": "sonnet"},
    {"name": "blog_writer", "role": "블로그 콘텐츠 작성", "layer": "execution", "model": "sonnet"},
    {"name": "social_writer", "role": "SNS 캡션/포스트 작성", "layer": "execution", "model": "haiku"},
    {"name": "email_writer", "role": "뉴스레터/이메일 작성", "layer": "execution", "model": "sonnet"},
    {"name": "brand_checker", "role": "브랜드 가이드 준수 검증", "layer": "quality", "model": "haiku"}
  ]
}
```

### 전략기획실
```json
{
  "name": "전략기획실",
  "category": "strategy",
  "default_agents": [
    {"name": "director", "role": "전체 분석 방향 설정", "layer": "orchestration", "model": "sonnet"},
    {"name": "web_researcher", "role": "웹 검색 및 정보 수집", "layer": "research", "model": "sonnet"},
    {"name": "market_analyst", "role": "시장 분석 및 규모 추정", "layer": "research", "model": "sonnet"},
    {"name": "optimist", "role": "긍정적 관점 토론", "layer": "execution", "model": "haiku"},
    {"name": "pessimist", "role": "부정적/리스크 관점", "layer": "execution", "model": "haiku"},
    {"name": "integrator", "role": "리서치+토론 결과 통합", "layer": "execution", "model": "sonnet"},
    {"name": "reporter", "role": "최종 보고서 작성", "layer": "quality", "model": "sonnet"}
  ]
}
```

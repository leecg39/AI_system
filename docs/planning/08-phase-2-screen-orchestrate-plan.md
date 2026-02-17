# 08-Phase2-Screen-Orchestrate-Plan

> 기준: `TASKS.md`, `specs/screens/*.yaml`, `.claude/orchestrate-state.json`
> 목적: `/orchestrate` Plan 모드에서 바로 실행 가능한 Phase 2 Screen 태스크 계획서 생성

---

## 0) EnterPlanMode 스냅샷

- 현재 오케스트레이션 상태: `current_phase=2`, `completed_phases=[0,1]` (`.claude/orchestrate-state.json`)
- 리소스 선행 조건: `P2-R1~P2-R4` 완료 처리됨 (`TASKS.md`)
- 상태 파일 참고값: `.claude/orchestrate-state.json`에는 `Backend 24 tests pass` 기록
- 최신 검증 실행값: `cd backend && ./venv/bin/pytest tests/api/test_teams.py tests/api/test_agents.py tests/api/test_templates.py tests/api/test_dashboard.py` → `61 passed`
- 남은 Phase 2 Screen 태스크: `P2-S1/S2/S3`의 `T1 -> T2 -> V` 9개

---

## 1) Plan Scope

### 포함 범위

- `P2-S1-T1`, `P2-S1-T2`, `P2-S1-V`
- `P2-S2-T1`, `P2-S2-T2`, `P2-S2-V`
- `P2-S3-T1`, `P2-S3-T2`, `P2-S3-V`

### 제외 범위

- Phase 3+ (`tasks/new`, monitor, results)
- 신규 백엔드 리소스 구현 (이미 Phase 2 리소스는 선행 완료)

---

## 2) Dependency Validation (Plan Mode 사전 검증)

| Screen Task | 선행 조건 | 상태 | 근거 |
|---|---|---|---|
| P2-S1-T1 (대시보드 UI) | P2-R1, P2-R4 | 충족 | `TASKS.md` 체크 + 해당 API 테스트 통과 |
| P2-S2-T1 (팀 상세 UI) | P2-R1, P2-R2 | 충족 | `TASKS.md` 체크 + 해당 API 테스트 통과 |
| P2-S3-T1 (팀 생성 UI) | P2-R3 | 충족 | `TASKS.md` 체크 + templates API 테스트 통과 |

추가 구조 확인:

- 기존 메인 라우트 레이아웃 존재: `frontend/src/app/(main)/layout.tsx`
- 현재 페이지는 placeholder 중심: `frontend/src/app/(main)/dashboard/page.tsx`, `frontend/src/app/(main)/teams/page.tsx`
- `/teams/[id]`, `/teams/new` 페이지는 아직 미구현

---

## 3) Phase 2 Screen 실행 순서 (고정)

> 정책: Screen 단위 직렬 실행 (한 Screen 내부는 `T1 -> T2 -> V` 순서 강제)

### Batch A: P2-S1 (홈 - 조직도 뷰)

1. **P2-S1-T1: 홈 조직도 UI 구현**
   - 담당: `frontend-specialist`
   - Worktree: `worktree/phase-2-dashboard`
   - 구현 대상(권장 경로):
     - `frontend/src/app/(main)/dashboard/page.tsx`
     - `frontend/src/components/dashboard/StatsSummary.tsx`
     - `frontend/src/components/dashboard/TeamOrgChart.tsx`
     - `frontend/src/components/dashboard/CreateTeamButton.tsx`
     - `frontend/src/services/teams.ts`, `frontend/src/services/dashboard.ts`
     - `frontend/src/types/team.ts`, `frontend/src/types/dashboard.ts`
   - 데이터 계약:
     - teams: `[id, name, config, status, agent_count, recent_task_count]`
     - dashboard_stats: `[running_tasks, completed_tasks_today, total_teams]`
   - 완료 조건:
     - 로딩/에러/빈상태/정상상태 렌더링
     - 팀 노드 클릭 시 `/teams/:id` 이동
     - 새 팀 만들기 버튼 `/teams/new` 이동

2. **P2-S1-T2: 홈 통합 테스트**
   - 담당: `test-specialist`
   - 테스트 경로(현 코드베이스 규칙 반영):
     - `frontend/src/__tests__/pages/dashboard.test.tsx`
   - 시나리오:
     - 초기 로드 렌더링
     - 팀 클릭 내비게이션
     - 빈 상태 메시지/CTA 확인

3. **P2-S1-V: 홈 연결점 검증**
   - 담당: `test-specialist`
   - 검증:
     - Field Coverage 2세트(teams, dashboard_stats)
     - Endpoint 연동 확인(`GET /api/v1/teams`, `GET /api/v1/dashboard/stats`)
     - Navigation 검증(`/teams/:id`, `/teams/new`)

---

### Batch B: P2-S2 (팀 상세)

4. **P2-S2-T1: 팀 상세 UI 구현**
   - 담당: `frontend-specialist`
   - Worktree: `worktree/phase-2-teams`
   - 구현 대상(권장 경로):
     - `frontend/src/app/(main)/teams/[id]/page.tsx`
     - `frontend/src/components/teams/TeamHeader.tsx`
     - `frontend/src/components/teams/AgentOrgChart.tsx`
     - `frontend/src/components/teams/AgentDetailPanel.tsx`
     - `frontend/src/components/teams/RecentTasksList.tsx`
     - `frontend/src/components/teams/NewTaskButton.tsx`
     - `frontend/src/services/agents.ts`
     - `frontend/src/types/agent.ts`
   - 데이터 계약:
     - teams: `[id, name, description, config, status]`
     - agents: `[id, name, role, layer, model, status]`
     - tasks: Phase 3(`P3-R1`) 연동 전까지 **deferred** (UI는 placeholder/disabled 상태 제공)
   - 완료 조건:
     - 에이전트 노드 클릭 시 상세 패널 오픈
     - 새 작업 버튼은 `Coming soon (Phase 3)` 상태로 비활성 처리
     - 최근 작업 영역은 placeholder(데이터 없음 안내) 제공

5. **P2-S2-T2: 팀 상세 통합 테스트**
   - 담당: `test-specialist`
   - 테스트 경로:
     - `frontend/src/__tests__/pages/team-detail.test.tsx`
   - 시나리오:
     - 초기 로드
     - 에이전트 클릭 패널
     - 새 작업 버튼 disabled + 안내 문구 확인
     - placeholder 렌더링 확인

6. **P2-S2-V: 팀 상세 연결점 검증**
   - 담당: `test-specialist`
   - 검증:
     - Field Coverage 2세트(teams, agents)
     - Endpoint 확인(`GET /api/v1/teams/{id}`, `GET /api/v1/teams/{team_id}/agents`)
     - Deferred 항목 확인(작업 관련 네비게이션은 Phase 3로 이관됨을 명시)

---

### Batch C: P2-S3 (팀 생성)

7. **P2-S3-T1: 팀 생성 UI 구현**
   - 담당: `frontend-specialist`
   - Worktree: `worktree/phase-2-teams`
   - 구현 대상(권장 경로):
     - `frontend/src/app/(main)/teams/new/page.tsx`
     - `frontend/src/components/teams/create/StepIndicator.tsx`
     - `frontend/src/components/teams/create/TemplateGrid.tsx`
     - `frontend/src/components/teams/create/CustomizeForm.tsx`
     - `frontend/src/components/teams/create/ConfirmSummary.tsx`
     - `frontend/src/services/templates.ts`
     - `frontend/src/services/teams.ts`
     - `frontend/src/services/agents.ts`
     - `frontend/src/types/template.ts`
     - `frontend/src/types/team.ts`, `frontend/src/types/agent.ts`
   - 데이터 계약:
     - team_templates: `[id, name, description, category, icon, default_agents]`
   - 생성 시퀀스(필수):
     - `GET /api/v1/templates`로 템플릿 로드
     - `POST /api/v1/teams`로 팀 생성
     - 생성된 `team_id` 기준으로 `POST /api/v1/teams/{team_id}/agents` 반복 호출
   - 완료 조건:
     - 3-step wizard 동작
     - 템플릿 선택 후 커스터마이즈로 진행
     - 에이전트 추가/수정/삭제 반영 후 생성 payload 일치
     - 생성 성공 시 `/dashboard` 이동

8. **P2-S3-T2: 팀 생성 통합 테스트**
   - 담당: `test-specialist`
   - 테스트 경로:
     - `frontend/src/__tests__/pages/team-create.test.tsx`
   - 시나리오:
     - 템플릿 선택
     - 에이전트 추가/편집 후 payload 반영
     - 팀 생성 완료 이동

9. **P2-S3-V: 팀 생성 연결점 검증**
   - 담당: `test-specialist`
   - 검증:
     - Field Coverage(team_templates)
      - Endpoint 확인(`GET /api/v1/templates`, `POST /api/v1/teams`)
      - Endpoint 확인(`POST /api/v1/teams/{team_id}/agents`)
      - Navigation 확인(`/dashboard`)

---

## 4) 품질 게이트 (각 Batch 공통)

각 `T1/T2/V` 완료 시 아래를 순서대로 통과:

1. `frontend` 타입 검사: `cd frontend && npm run type-check`
2. 대상 페이지 테스트: `cd frontend && npm run test -- src/__tests__/pages/<target>.test.tsx`
3. 관련 회귀 테스트(로그인 포함 최소 스모크)
4. `frontend` 빌드: `cd frontend && npm run build`
5. 백엔드 스모크(Phase2 의존 API): `cd backend && ./venv/bin/pytest tests/api/test_teams.py tests/api/test_agents.py tests/api/test_templates.py tests/api/test_dashboard.py`

완료 판정 조건:

- 타입 에러 0
- 신규/수정 테스트 통과
- 빌드 성공
- `TASKS.md` 체크 상태 동기화

---

## 5) /orchestrate Plan Mode 실행 프롬프트 템플릿

아래 순서로 `/orchestrate`에 전달:

1. `P2-S1-T1 실행` → 완료 후 `P2-S1-T2` → `P2-S1-V`
2. `P2-S2-T1 실행` → 완료 후 `P2-S2-T2` → `P2-S2-V`
3. `P2-S3-T1 실행` → 완료 후 `P2-S3-T2` → `P2-S3-V`

예시 프롬프트:

```text
/orchestrate TASKS.md 기준 Phase 2 Screen 실행.
Plan 모드로 시작하고 아래 순서 고정:
1) P2-S1-T1 -> P2-S1-T2 -> P2-S1-V
2) P2-S2-T1 -> P2-S2-T2 -> P2-S2-V
3) P2-S3-T1 -> P2-S3-T2 -> P2-S3-V

규칙:
- Screen 간 병렬 실행 금지
- P2-S2의 tasks/results 이동은 Phase 3까지 deferred(버튼 disabled/placeholder 유지)
- 각 Screen의 T1/T2/V 완료 후 품질 게이트(type-check, test, build) 통과 필수
- 완료 시 TASKS.md 체크 상태 반영
```

---

## 6) ExitPlanMode 승인 체크리스트

- [ ] 선행 리소스 의존성 확인 완료
- [ ] Screen 실행 순서 확정 (`S1 -> S2 -> S3`)
- [ ] 각 Screen별 담당/파일/검증 기준 명시
- [ ] 품질 게이트 명시(type-check/test/build)
- [ ] TASKS 상태 반영 방식 명시

체크리스트가 모두 충족되면 ExitPlanMode 승인 후 실행 단계로 전환.

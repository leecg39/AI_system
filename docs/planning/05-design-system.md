# Design System

## 1. 디자인 원칙

### 브랜드 무드
- **전문적이면서 접근하기 쉬운** - AI 기술이지만 비개발자도 편하게 사용
- **신뢰감** - 에이전트가 일하고 있다는 확신을 주는 UI
- **효율적** - 최소한의 클릭으로 작업 요청

### 감정 키워드
- 자동화의 편안함
- AI 팀을 관리하는 성취감
- 실시간 진행의 투명함

---

## 2. 컬러 시스템

### Primary Colors
| 이름 | HEX | 용도 |
|------|-----|------|
| Primary | #2563EB | 주요 버튼, 링크, 활성 상태 |
| Primary Dark | #1D4ED8 | 호버, 포커스 |
| Primary Light | #DBEAFE | 배경 하이라이트 |

### Status Colors
| 이름 | HEX | 용도 |
|------|-----|------|
| Running (Green) | #22C55E | 에이전트 작업 중 |
| Waiting (Yellow) | #EAB308 | 에이전트 대기 중 |
| Completed (Blue) | #3B82F6 | 작업 완료 |
| Error (Red) | #EF4444 | 오류 |
| Idle (Gray) | #9CA3AF | 비활성 |

### Neutral Colors
| 이름 | HEX | 용도 |
|------|-----|------|
| Background | #F8FAFC | 페이지 배경 |
| Surface | #FFFFFF | 카드, 패널 |
| Border | #E2E8F0 | 구분선 |
| Text Primary | #1E293B | 본문 텍스트 |
| Text Secondary | #64748B | 보조 텍스트 |

---

## 3. 타이포그래피

| 요소 | 폰트 | 크기 | 무게 |
|------|------|------|------|
| H1 (페이지 제목) | Inter | 28px | Bold (700) |
| H2 (섹션 제목) | Inter | 22px | SemiBold (600) |
| H3 (카드 제목) | Inter | 18px | SemiBold (600) |
| Body | Inter | 14px | Regular (400) |
| Body Small | Inter | 12px | Regular (400) |
| Label | Inter | 13px | Medium (500) |
| Code/Mono | JetBrains Mono | 13px | Regular (400) |

---

## 4. 핵심 컴포넌트

### 4.1 에이전트 상태 카드
```
┌────────────────────────────────┐
│ 🟢 blog_writer                 │
│ "블로그 초안 작성 중..."         │
│ ████████████░░░░░░░░ 65%       │
│                    ⏱ 2:34      │
└────────────────────────────────┘
```

### 4.2 팀 카드 (조직도 뷰)
```
┌────────────────────────────────┐
│ 📢 마케팅 팀                    │
│ 에이전트: 5명                   │
│ 최근 작업: 3건                  │
│ 상태: 🟢 활성                   │
└────────────────────────────────┘
```

### 4.3 조직도 노드
- 계층별 색상 구분:
  - Orchestration: Primary Blue
  - Research: Purple (#7C3AED)
  - Execution: Green (#22C55E)
  - Quality: Orange (#F59E0B)

### 4.4 작업 요청 폼
- 단계별 진행: 옵션 선택 → 입력 → 확인 → 실행
- 프로그레스 스텝 인디케이터

---

## 5. 레이아웃

### 기본 레이아웃
```
┌──────┬─────────────────────────┐
│      │         Header          │
│ Side │─────────────────────────│
│ bar  │                         │
│      │      Main Content       │
│ 240px│                         │
│      │                         │
└──────┴─────────────────────────┘
```

### 반응형 브레이크포인트
| 크기 | 너비 | 사이드바 |
|------|------|---------|
| Desktop | 1280px+ | 고정 표시 |
| Tablet | 768px - 1279px | 접기 가능 |
| Mobile | ~ 767px | 숨김 (햄버거) |

---

## 6. 아이콘 시스템

- 라이브러리: Lucide Icons
- 팀별 기본 아이콘:
  - 마케팅: Megaphone
  - 재무: Calculator
  - 전략기획: Lightbulb
  - 교육: GraduationCap
  - 이커머스: ShoppingCart
  - 경영지원: Building2
  - 사업개발: Rocket
  - 브레인스토밍: Brain
  - 데이터: BarChart3
  - CS: Headphones

---

## 7. 애니메이션/트랜지션

| 요소 | 애니메이션 | 시간 |
|------|----------|------|
| 페이지 전환 | Fade in | 200ms |
| 카드 호버 | Scale up 1.02 + shadow | 150ms |
| 프로그레스 바 | Width transition | 300ms |
| 상태 변경 | Color transition + pulse | 500ms |
| 모달 | Fade + slide up | 200ms |
| 에이전트 활성화 | Glow pulse | 1000ms loop |

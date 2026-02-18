# Draft: Neo-Brutalism Frontend Redesign

## Requirements (confirmed)
- 사용자 요청: 프론트엔드 전체 UI를 네오브루탈리즘 스타일로 전체 리디자인(기능 변경 없음)
- 이전 대화에서 합의한 범위: 백엔드/DB/seed 이전 작업은 별도 단계이며, 이번 단계는 프론트엔드 시각/레이아웃 정돈 중심
- 전체 화면(대시보드, 팀, 태스크, 설정, 인증) 및 공통 레이아웃(사이드바/헤더/카드/버튼/폼) 반영

## Technical Decisions
- 기술 스택은 기존 유지: Next.js App Router + TypeScript + Tailwind + shadcn/ui 패턴
- 전역 토큰/유틸리티/기본 UI 컴포넌트(`Button`, `Card`, `Input` 계열) 우선 재정의로 일관성 확보
- 레거시 폰트를 `Inter`에서 네오브루탈리즘 톤에 맞는 대체 산세리프(예: `Space Grotesk` 또는 `IBM Plex Sans`)로 교체 고려
- 라우팅·도메인 로직은 유지하고 시각 언어만 교체

## Research Findings
- 핵심 레이아웃/컴포넌트 위치는 이미 매핑됨: `frontend/src/app/globals.css`, `frontend/src/app/layout.tsx`, `frontend/src/app/(main)/layout.tsx`, `frontend/src/components/layout/*`, `frontend/src/components/ui/*`
- 테스트는 텍스트/동작 기준이 많아 클래스명 변경만으로는 직접 실패 위험이 낮으나, 스냅샷 또는 시맨틱 선택자가 있는 테스트는 후속 검증 필요
- 색상/테두리/입체/그림자/여백의 기본값은 기존 CSS 변수와 shadcn 테마에 강하게 묶여 있어, 공통 토큰 변경이 최대 효율

## Open Questions
- 검증 방식: 기존 단위/통합 테스트 유지 + Playwright 스모크/시각 QA를 추가로 필수 수행(확정)
- 배경/타이포 기본 스타일: `Space Grotesk` + 기하학적 그라데이션 + 고대비 경계/두꺼운 보더 + 강한 그림자

## Decisions Made (resolved)
- QA 범위: 기존 테스트 스위트 실행 + Playwright 스모크/시각 검증 스냅샷을 함께 수행
- 스타일 기준: `Space Grotesk` + `geometric gradients` 조합으로 네오브루탈리즘 톤 확정

## Scope Boundaries
- INCLUDE: `frontend/` 전체 화면 스타일, 공통 레이아웃 컴포넌트, 공유 UI 프리미티브, 전역 CSS 변수
- INCLUDE: 시각 일관성 유지 위한 문구/여백/그림자/호버/집중 상태 재정의
- EXCLUDE: 백엔드 라우트/DB 스키마/seed 로직, 신규 기능 플로우 추가, 새로운 페이지/컴포넌트 생성(필요 시 기존 구성요소 확장만)
- EXCLUDE: 동작 로직 변경, API 계약 변경, 인증/권한 체계 변경

## Next Step Plan (proposed)
- 1단계: 테스트 인프라 존재 여부 확인 → 실행 가능한 QA 전략 고정
- 2단계: 계획 문서 생성(파장/색상/타이포/입체감/애니메이션/컴포넌트 기준)
- 3단계: `.sisyphus/plans` 단일 실행 계획 작성 후 `/start-work`

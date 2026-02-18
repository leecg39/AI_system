# P1-S1-T2 로그인 통합 테스트 상세 문서

## 개요

이 문서는 `frontend/src/__tests__/pages/login.test.tsx`의 모든 테스트 케이스를 상세히 설명합니다.

## 테스트 케이스 목록

### 1. 렌더링 테스트 (3개)

#### 1.1 로그인 페이지가 정상적으로 렌더링되어야 한다
- **목표**: 페이지 초기 렌더링 확인
- **검증 항목**:
  - 제목 "로그인" 표시
  - 이메일 입력 필드 (label: "이메일")
  - 비밀번호 입력 필드 (label: "비밀번호")
  - 제출 버튼 (text: "로그인")
  - 회원가입 링크 (text: "회원가입")
- **상태**: RED 🔴 (미구현)

#### 1.2 Google 로그인 버튼이 비활성화 상태로 표시되어야 한다
- **목표**: 준비 중인 기능을 비활성화 상태로 표시
- **검증 항목**:
  - Google 로그인 버튼 존재
  - `disabled` 속성 = true
- **상태**: RED 🔴 (미구현)

#### 1.3 회원가입 링크가 /signup으로 이동해야 한다
- **목표**: 회원가입 페이지 링크 확인
- **검증 항목**:
  - Link href = "/signup"
  - 클릭 가능
- **상태**: RED 🔴 (미구현)

---

### 2. 폼 유효성 검사 테스트 (5개)

#### 2.1 빈 이메일로 제출 시 에러 메시지를 표시해야 한다
- **목표**: 빈 이메일 필드 검증
- **시나리오**:
  1. 비밀번호만 입력: "ValidPassword123"
  2. 제출 버튼 클릭
- **기대 결과**:
  - 에러 메시지: "유효한 이메일 주소를 입력해주세요"
  - 폼 제출 불가능
- **상태**: RED 🔴 (미구현)

#### 2.2 잘못된 이메일 형식으로 제출 시 에러 메시지를 표시해야 한다
- **목표**: 이메일 형식 검증 (RFC 5322)
- **시나리오**:
  1. 이메일: "not-an-email" (@ 없음)
  2. 비밀번호: "ValidPassword123"
  3. 제출
- **기대 결과**:
  - 에러 메시지: "유효한 이메일 주소를 입력해주세요"
  - aria-invalid = "true"
- **상태**: RED 🔴 (미구현)

#### 2.3 8자 미만의 비밀번호로 제출 시 에러 메시지를 표시해야 한다
- **목표**: 비밀번호 최소 길이 검증
- **시나리오**:
  1. 이메일: "test@example.com"
  2. 비밀번호: "short" (5자)
  3. 제출
- **기대 결과**:
  - 에러 메시지: "비밀번호는 최소 8자 이상이어야 합니다"
  - 폼 제출 불가능
- **상태**: RED 🔴 (미구현)

#### 2.4 올바른 형식의 이메일과 비밀번호로 제출이 가능해야 한다
- **목표**: 유효한 입력 형식 확인
- **시나리오**:
  1. 이메일: "test@example.com"
  2. 비밀번호: "ValidPassword123" (8자 이상)
  3. 제출 버튼 클릭
- **기대 결과**:
  - 유효성 검사 에러 없음
  - 제출 가능 (API 호출 진행)
- **상태**: RED 🔴 (미구현)

#### 2.5 올바른 형식의 입력 시 에러 없음
- **목표**: 유효성 검사 에러 미표시 확인
- **시나리오**:
  1. 유효한 이메일/비밀번호 입력
  2. 제출
  3. 에러 메시지 부재 확인
- **기대 결과**:
  - "유효한 이메일..." 에러 메시지 없음
  - "비밀번호는 최소..." 에러 메시지 없음
- **상태**: RED 🔴 (미구현)

---

### 3. 로그인 성공 플로우 (4개) ✅ TASKS.md 시나리오 1

#### 3.1 올바른 이메일/비밀번호로 로그인 시 대시보드로 이동해야 한다
- **목표**: 주요 성공 경로 (Happy Path)
- **시나리오**:
  1. Mock: authService.login → 성공
  2. Mock: authService.getCurrentUser → 사용자 정보 반환
  3. 이메일: "test@example.com"
  4. 비밀번호: "ValidPassword123"
  5. 제출
- **기대 결과**:
  - useRouter.push('/dashboard') 호출
  - 대시보드 페이지로 이동
- **상태**: RED 🔴 (미구현)

#### 3.2 로그인 중일 때 로그인 버튼이 비활성화되고 로딩 텍스트가 표시되어야 한다
- **목표**: 로딩 상태 UX 확인
- **시나리오**:
  1. Mock: authService.login → 지연된 응답 (Promise 미해결)
  2. 유효한 이메일/비밀번호 입력
  3. 제출
  4. 로딩 중 상태 확인
  5. 요청 완료 후 상태 복구 확인
- **기대 결과**:
  - 버튼 텍스트: "로그인 중..."
  - 버튼 disabled = true
  - 입력 필드 disabled = true
  - 요청 완료 후 다시 활성화
- **상태**: RED 🔴 (미구현)

#### 3.3 JWT 토큰이 저장되어야 한다
- **목표**: 토큰 저장소 확인
- **시나리오**:
  1. Mock: authService.login → access_token 반환
  2. 로그인 성공
- **기대 결과**:
  - authService.login 호출됨
  - 매개변수: { email: "test@example.com", password: "ValidPassword123" }
  - 응답: { access_token: "test-jwt-token-123", token_type: "Bearer" }
- **검증**:
  - Zustand 스토어에 토큰 저장
  - localStorage에 토큰 저장 (authLib.setToken)
- **상태**: RED 🔴 (미구현)

#### 3.4 useAuthStore의 login 액션이 호출되어야 한다
- **목표**: 상태 관리 액션 호출 확인
- **시나리오**:
  1. useAuthStore.login 메서드 모킹
  2. 로그인 페이지에서 폼 제출
- **기대 결과**:
  - store.login({ email: "test@example.com", password: "ValidPassword123" })
  - 성공 응답 처리
- **상태**: RED 🔴 (미구현)

---

### 4. 로그인 실패 플로우 (6개) ✅ TASKS.md 시나리오 2

#### 4.1 잘못된 비밀번호로 로그인 시 에러 메시지를 표시해야 한다
- **목표**: 인증 실패 처리
- **시나리오**:
  1. Mock: authService.login → 에러 (Invalid credentials)
  2. 이메일: "test@example.com"
  3. 비밀번호: "WrongPassword123"
  4. 제출
- **기대 결과**:
  - 에러 메시지: "Invalid credentials"
  - 빨간색 알림 박스 표시
  - 대시보드 이동 안 함
- **상태**: RED 🔴 (미구현)

#### 4.2 존재하지 않는 이메일로 로그인 시 에러 메시지를 표시해야 한다
- **목표**: 사용자 미존재 처리
- **시나리오**:
  1. Mock: authService.login → 에러 (User not found)
  2. 이메일: "nonexistent@example.com"
  3. 비밀번호: "SomePassword123"
  4. 제출
- **기대 결과**:
  - 에러 메시지: "User not found"
  - 사용자에게 명확한 피드백
  - 대시보드 이동 안 함
- **상태**: RED 🔴 (미구현)

#### 4.3 서버 에러 발생 시 기본 에러 메시지를 표시해야 한다
- **목표**: 예상치 못한 에러 처리
- **시나리오**:
  1. Mock: authService.login → 에러 메시지 없음 (빈 문자열)
  2. 제출
- **기대 결과**:
  - 기본 에러 메시지: "로그인에 실패했습니다. 다시 시도해주세요."
  - 사용자 친화적 메시지
- **상태**: RED 🔴 (미구현)

#### 4.4 에러 발생 후 로그인 버튼이 다시 활성화되어야 한다
- **목표**: 에러 이후 재시도 가능
- **시나리오**:
  1. 로그인 실패
  2. 에러 메시지 표시
  3. 버튼 활성화 상태 확인
- **기대 결과**:
  - 로그인 버튼 disabled = false
  - 사용자가 다시 시도 가능
- **상태**: RED 🔴 (미구현)

#### 4.5 API에서 detail 에러 메시지를 반환하면 표시해야 한다
- **목표**: API 상세 에러 메시지 처리
- **시나리오**:
  1. Mock: authService.login → error.detail = "Email not verified"
  2. 제출
- **기대 결과**:
  - 에러 메시지: "Email not verified"
  - API로부터의 구체적 피드백 표시
- **상태**: RED 🔴 (미구현)

#### 4.6 대시보드로 이동하지 않아야 한다
- **목표**: 로그인 실패 시 보안 확인
- **시나리오**:
  1. 모든 실패 케이스
  2. 라우팅 호출 확인
- **기대 결과**:
  - mockPush.toHaveBeenCalled() = false
  - 현재 페이지 유지
- **상태**: RED 🔴 (미구현)

---

### 5. 다중 시도 및 상태 관리 (2개)

#### 5.1 첫 번째 로그인 실패 후 두 번째 로그인 시도가 가능해야 한다
- **목표**: 상태 복구 확인
- **시나리오**:
  1. 첫 시도: authService.login → 실패
  2. 에러 메시지 표시 확인
  3. 입력 필드 초기화
  4. 두 번째 시도: authService.login → 성공
- **기대 결과**:
  - 첫 번째: 에러 메시지 표시
  - 두 번째: 대시보드 이동
  - 독립적인 요청 처리
- **상태**: RED 🔴 (미구현)

#### 5.2 로딩 중 입력 필드가 비활성화되어야 한다
- **목표**: UX 개선 (입력 방지)
- **시나리오**:
  1. Mock: authService.login → 지연 응답
  2. 폼 제출
  3. 로딩 중 입력 필드 상태 확인
- **기대 결과**:
  - emailInput.disabled = true
  - passwordInput.disabled = true
  - 입력 불가능
  - 요청 완료 후 다시 활성화
- **상태**: RED 🔴 (미구현)

---

### 6. 접근성(a11y) 테스트 (3개)

#### 6.1 에러 메시지가 aria-invalid로 표시되어야 한다
- **목표**: 스크린 리더 접근성
- **시나리오**:
  1. 잘못된 이메일 입력: "invalid-email"
  2. 제출
  3. aria-invalid 속성 확인
- **기대 결과**:
  - emailInput.getAttribute('aria-invalid') = "true"
  - 스크린 리더 사용자에게 에러 상태 전달
- **상태**: RED 🔴 (미구현)

#### 6.2 제출 버튼이 로딩 중에 aria-busy로 표시되어야 한다
- **목표**: 로딩 상태 접근성
- **시나리오**:
  1. Mock: authService.login → 지연 응답
  2. 폼 제출
  3. aria-busy 속성 확인
- **기대 결과**:
  - submitButton.getAttribute('aria-busy') = "true"
  - 스크린 리더에 로딩 상태 전달
- **상태**: RED 🔴 (미구현)

#### 6.3 역할 속성(role)을 가진 요소들이 올바르게 표시되어야 한다
- **목표**: 의미론적 HTML
- **검증 항목**:
  - 버튼: role="button" (또는 native <button>)
  - 링크: role="link" (또는 native <a>)
  - 제목: role="heading"
  - 필드: label 연결
- **기대 결과**:
  - 모든 상호작용 요소가 올바른 역할 보유
  - 스크린 리더 호환성
- **상태**: RED 🔴 (미구현)

---

### 7. UI 상호작용 테스트 (2개)

#### 7.1 에러 메시지 옆에 빨간색 텍스트 스타일이 적용되어야 한다
- **목표**: 시각적 피드백
- **시나리오**:
  1. 잘못된 입력으로 제출
  2. 에러 메시지 스타일 확인
- **기대 결과**:
  - errorMessage.hasClass('text-red-600') = true
  - Tailwind CSS 스타일 적용
- **상태**: RED 🔴 (미구현)

#### 7.2 카드 레이아웃이 최대 너비 제약을 가져야 한다
- **목표**: 반응형 디자인
- **검증 항목**:
  - Card 컴포넌트에 max-w-md 클래스
  - 최대 너비: 448px
- **기대 결과**:
  - container.querySelector('.max-w-md') 존재
  - 데스크톱에서도 가독성 유지
- **상태**: RED 🔴 (미구현)

---

## 테스트 데이터 정의

### Mock 사용자 데이터
```typescript
{
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  is_active: true,
  created_at: '2024-01-01'
}
```

### Mock JWT 토큰
```
access_token: 'test-jwt-token'
token_type: 'Bearer'
```

### Mock 에러 응답
```typescript
// 401 Unauthorized
'Invalid credentials'

// 404 Not Found
'User not found'

// 500 Server Error
'' (빈 메시지) → 기본 에러 메시지 표시
```

---

## 테스트 실행 명령어

```bash
# 전체 테스트
npm run test

# 로그인 테스트만 실행
npm run test -- src/__tests__/pages/login.test.tsx

# Watch 모드
npm run test -- --watch src/__tests__/pages/login.test.tsx

# 커버리지 리포트
npm run test -- --coverage src/__tests__/pages/login.test.tsx

# 특정 테스트 그룹만 실행
npm run test -- --grep "로그인 성공 플로우"
```

---

## 예상 테스트 결과 (RED 상태)

모든 테스트는 현재 **의도적으로 FAIL** 상태입니다:

```
FAIL  src/__tests__/pages/login.test.tsx

LoginPage
  렌더링
    ✗ 로그인 페이지가 정상적으로 렌더링되어야 한다
    ✗ Google 로그인 버튼이 비활성화 상태로 표시되어야 한다
    ✗ 회원가입 링크가 /signup으로 이동해야 한다
  폼 유효성 검사
    ✗ 빈 이메일로 제출 시 에러 메시지를 표시해야 한다
    ✗ 잘못된 이메일 형식으로 제출 시 에러 메시지를 표시해야 한다
    ...

Test Suites: 1 failed, 0 passed
Tests: 25 failed, 0 passed
```

이는 **정상적인 RED 상태**입니다. TDD 원칙을 따르고 있습니다.

---

## 다음 단계

### Phase 2: 구현 (GREEN)
백엔드/프론트엔드에서 구현 코드를 작성하면 테스트가 통과할 것입니다.

### Phase 3: 리팩토링 (REFACTOR)
테스트 통과 후 코드 개선 (선택사항)

---

**작성일**: 2026-02-17
**파일**: `/Users/user01/Desktop/AI_system/worktree/phase-1-auth/frontend/src/__tests__/pages/login.test.tsx`
**상태**: RED 🔴 (정상)

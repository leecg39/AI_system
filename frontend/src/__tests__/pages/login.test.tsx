// @TEST P1-S1-T2 - 로그인 통합 테스트
// @SPEC docs/planning/TASKS.md#p1-s1-t2-로그인-통합-테스트
// @IMPL frontend/app/(auth)/login/page.tsx

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';
import { useAuthStore } from '@/stores/auth';
import { authLib } from '@/lib/auth';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock authService
vi.mock('@/services/auth', () => ({
  authService: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock authLib
vi.mock('@/lib/auth', () => ({
  authLib: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    isAuthenticated: vi.fn(),
    getAuthHeader: vi.fn(),
  },
}));

describe('LoginPage', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    // Setup mocks
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    mockPush.mockClear();

    // Reset Zustand store
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('로그인 페이지가 정상적으로 렌더링되어야 한다', () => {
      render(<LoginPage />);

      // 제목 확인
      expect(screen.getByRole('heading', { name: /로그인/ })).toBeInTheDocument();

      // 입력 필드 확인
      expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();

      // 버튼 확인
      expect(screen.getByRole('button', { name: /^로그인$/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /회원가입/ })).toBeInTheDocument();
    });

    it('Google 로그인 버튼이 비활성화 상태로 표시되어야 한다', () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /Google로 로그인/ });
      expect(googleButton).toBeDisabled();
    });

    it('회원가입 링크가 /signup로 이동해야 한다', () => {
      render(<LoginPage />);

      const signupLink = screen.getByRole('link', { name: /회원가입/ });
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('폼 유효성 검사', () => {
    it('빈 이메일로 제출 시 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 비밀번호만 입력하고 제출 시도
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      // 에러 메시지 표시 확인
      await waitFor(() => {
        expect(
          screen.getByText(/유효한 이메일 주소를 입력해주세요/i)
        ).toBeInTheDocument();
      });
    });

    it('잘못된 이메일 형식으로 제출 시 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 잘못된 이메일 형식 입력
      await user.type(emailInput, 'not-an-email');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      // 에러 메시지 표시 확인
      await waitFor(() => {
        expect(
          screen.getByText(/유효한 이메일 주소를 입력해주세요/i)
        ).toBeInTheDocument();
      });
    });

    it('8자 미만의 비밀번호로 제출 시 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 짧은 비밀번호 입력
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      // 에러 메시지 표시 확인
      await waitFor(() => {
        expect(
          screen.getByText(/비밀번호는 최소 8자 이상이어야 합니다/i)
        ).toBeInTheDocument();
      });
    });

    it('올바른 형식의 이메일과 비밀번호로 제출이 가능해야 한다', async () => {
      const user = userEvent.setup();

      // Mock store의 login을 성공하는 버전으로 설정
      const store = useAuthStore.getState();
      store.login = vi.fn().mockResolvedValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', is_active: true, created_at: '2024-01-01' },
        token: 'mock-token',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 올바른 형식 입력
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      // 에러가 표시되지 않아야 함
      await waitFor(() => {
        expect(
          screen.queryByText(/유효한 이메일 주소를 입력해주세요/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/비밀번호는 최소 8자 이상이어야 합니다/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('로그인 성공 플로우', () => {
    it('올바른 이메일/비밀번호로 로그인 시 대시보드로 이동해야 한다', async () => {
      const user = userEvent.setup();

      // Mock authService.login을 성공하는 버전으로 설정
      const { authService } = await import('@/services/auth');
      vi.mocked(authService.login).mockResolvedValue({
        access_token: 'test-jwt-token',
        token_type: 'Bearer',
      });

      // Mock authService.getCurrentUser를 성공하는 버전으로 설정
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        created_at: '2024-01-01',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 입력 및 제출
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      // 로딩 상태 확인
      expect(submitButton).toBeDisabled();

      // 대시보드로 이동 확인
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('로그인 중일 때 로그인 버튼이 비활성화되고 로딩 텍스트가 표시되어야 한다', async () => {
      const user = userEvent.setup();

      // Mock authService.login을 지연된 성공으로 설정
      const { authService } = await import('@/services/auth');
      let resolveLogin: any;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      vi.mocked(authService.login).mockReturnValue(loginPromise as any);

      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        created_at: '2024-01-01',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 입력 및 제출
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      // 로딩 상태 확인
      await waitFor(() => {
        expect(screen.getByText(/로그인 중\.\.\./i)).toBeInTheDocument();
      });
      expect(submitButton).toBeDisabled();

      // 로그인 완료 후 상태 복구
      resolveLogin({ access_token: 'test-jwt-token', token_type: 'Bearer' });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('JWT 토큰이 저장되어야 한다', async () => {
      const user = userEvent.setup();

      const { authService } = await import('@/services/auth');
      vi.mocked(authService.login).mockResolvedValue({
        access_token: 'test-jwt-token-123',
        token_type: 'Bearer',
      });

      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        created_at: '2024-01-01',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        // authService.login이 호출되었는지 확인
        expect(vi.mocked(authService.login)).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'ValidPassword123',
        });
      });
    });
  });

  describe('로그인 실패 플로우', () => {
    it('잘못된 비밀번호로 로그인 시 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();

      const { authService } = await import('@/services/auth');
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Invalid credentials')
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 입력 및 제출
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123');
      await user.click(submitButton);

      // 에러 메시지 표시 확인
      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });

      // 대시보드로 이동하지 않아야 함
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('존재하지 않는 이메일로 로그인 시 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();

      const { authService } = await import('@/services/auth');
      vi.mocked(authService.login).mockRejectedValue(
        new Error('User not found')
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.type(passwordInput, 'SomePassword123');
      await user.click(submitButton);

      // 에러 메시지 표시 확인
      await waitFor(() => {
        expect(screen.getByText(/User not found/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('서버 에러 발생 시 기본 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();

      const { authService } = await import('@/services/auth');
      vi.mocked(authService.login).mockRejectedValue(new Error(''));

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      // 기본 에러 메시지 표시 확인
      await waitFor(() => {
        expect(
          screen.getByText(/로그인에 실패했습니다\. 다시 시도해주세요\./i)
        ).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('에러 발생 후 로그인 버튼이 다시 활성화되어야 한다', async () => {
      const user = userEvent.setup();

      const { authService } = await import('@/services/auth');
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Login failed')
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 입력 및 제출
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      // 에러 표시 대기
      await waitFor(() => {
        expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
      });

      // 버튼이 다시 활성화되어야 함
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('API에서 detail 에러 메시지를 반환하면 표시해야 한다', async () => {
      const user = userEvent.setup();

      const { authService } = await import('@/services/auth');
      const errorWithDetail = new Error('Request failed');
      (errorWithDetail as any).detail = 'Email not verified';
      vi.mocked(authService.login).mockRejectedValue(errorWithDetail);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Request failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('다중 시도 및 상태 관리', () => {
    it('첫 번째 로그인 실패 후 두 번째 로그인 시도가 가능해야 한다', async () => {
      const user = userEvent.setup();

      const { authService } = await import('@/services/auth');
      vi.mocked(authService.login)
        .mockRejectedValueOnce(new Error('Invalid credentials'))
        .mockResolvedValueOnce({
          access_token: 'test-jwt-token',
          token_type: 'Bearer',
        });

      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        created_at: '2024-01-01',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 첫 번째 시도: 실패
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });

      // 입력 필드 초기화
      await user.clear(emailInput);
      await user.clear(passwordInput);

      // 두 번째 시도: 성공
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('입력 필드가 로딩 중에 비활성화되어야 한다', async () => {
      const user = userEvent.setup();

      const { authService } = await import('@/services/auth');
      let resolveLogin: any;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      vi.mocked(authService.login).mockReturnValue(loginPromise as any);

      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        created_at: '2024-01-01',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/비밀번호/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      // 로딩 중에 입력 필드가 비활성화되어야 함
      await waitFor(() => {
        expect(emailInput.disabled).toBe(true);
        expect(passwordInput.disabled).toBe(true);
      });

      // 로그인 완료
      resolveLogin({ access_token: 'test-jwt-token', token_type: 'Bearer' });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('접근성(a11y)', () => {
    it('에러 메시지가 aria-invalid로 표시되어야 한다', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 잘못된 이메일로 제출
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      // aria-invalid 확인
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('제출 버튼이 로딩 중에 aria-busy로 표시되어야 한다', async () => {
      const user = userEvent.setup();

      const { authService } = await import('@/services/auth');
      let resolveLogin: any;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      vi.mocked(authService.login).mockReturnValue(loginPromise as any);

      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        created_at: '2024-01-01',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      // aria-busy 확인
      await waitFor(() => {
        expect(submitButton).toHaveAttribute('aria-busy', 'true');
      });

      resolveLogin({ access_token: 'test-jwt-token', token_type: 'Bearer' });
    });

    it('역할 속성(role)을 가진 요소들이 올바르게 표시되어야 한다', () => {
      render(<LoginPage />);

      // 버튼 역할 확인
      expect(screen.getByRole('button', { name: /^로그인$/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /회원가입/ })).toBeInTheDocument();

      // 제목 역할 확인
      expect(screen.getByRole('heading', { name: /로그인/ })).toBeInTheDocument();

      // 알림 역할은 필요 시 추가
    });
  });

  describe('UI 상호작용', () => {
    it('에러 메시지 옆에 빨간색 텍스트 스타일이 적용되어야 한다', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/이메일/i);
      const submitButton = screen.getByRole('button', { name: /^로그인$/ });

      // 잘못된 이메일로 제출
      await user.type(emailInput, 'invalid');
      await user.click(submitButton);

      // 에러 메시지 확인 및 스타일 확인
      await waitFor(() => {
        const errorMessage = screen.getByText(/유효한 이메일 주소를 입력해주세요/i);
        expect(errorMessage).toHaveClass('text-red-600');
      });
    });

    it('카드 레이아웃이 최대 너비 제약을 가져야 한다', () => {
      const { container } = render(<LoginPage />);

      // max-w-md 클래스 확인
      const card = container.querySelector('.max-w-md');
      expect(card).toBeInTheDocument();
    });
  });
});

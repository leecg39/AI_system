// @TASK P1-S2-T1 - 회원가입 UI 페이지 구현
// @SPEC docs/planning/03-user-flow.md#회원가입
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Zod 스키마 정의
const signupSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);
  const storeError = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setFormError(null);
    clearError();

    try {
      await register({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      router.push('/dashboard');
    } catch (error: any) {
      setFormError(error.message || '회원가입에 실패했습니다');
    }
  };

  const displayError = formError || storeError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md border-[3px] border-foreground bg-white p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-4xl font-black text-foreground">AI SYSTEM</h1>
          <h2 className="text-2xl font-black text-foreground">회원가입</h2>
          <p className="text-sm text-muted-foreground">
            계정을 생성하여 시작하세요
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이름 입력 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-bold">이름</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              className="border-[2px] border-foreground"
              {...formRegister('name')}
              disabled={isLoading}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm font-bold text-red-600" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* 이메일 입력 */}
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="border-[2px] border-foreground"
              {...formRegister('email')}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm font-bold text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="border-[2px] border-foreground"
              {...formRegister('password')}
              disabled={isLoading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-sm font-bold text-red-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* 비밀번호 확인 입력 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-bold">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="border-[2px] border-foreground"
              {...formRegister('confirmPassword')}
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            />
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm font-bold text-red-600" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* 에러 메시지 */}
          {displayError && (
            <div
              className="border-[3px] border-red-500 bg-red-50 p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
              role="alert"
            >
              <p className="text-sm font-bold text-red-600">{displayError}</p>
            </div>
          )}

          {/* 가입 버튼 */}
          <Button
            type="submit"
            className="w-full border-[2px] border-foreground bg-foreground font-bold text-background shadow-[4px_4px_0_0_rgba(59,130,246,1)] hover:shadow-[2px_2px_0_0_rgba(59,130,246,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                가입 중...
              </>
            ) : (
              '가입하기'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <p className="text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link
              href="/login"
              className="font-black text-blue-600 hover:underline"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

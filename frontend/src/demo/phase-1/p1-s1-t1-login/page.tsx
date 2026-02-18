// @TASK P1-S1-T1 - 로그인 페이지 데모
// @SPEC docs/planning/screens.yaml#login
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DEMO_STATES = {
  normal: {
    description: '정상 상태 - 로그인 폼 렌더링',
    url: '/login',
  },
  loading: {
    description: '로딩 상태 - 버튼 disabled + spinner (실제 페이지에서 폼 제출 시 확인)',
    url: '/login',
  },
  error: {
    description: '에러 상태 - 잘못된 이메일/비밀번호 입력 시 (실제 페이지에서 확인)',
    url: '/login',
  },
  validation: {
    description: '유효성 검사 - 이메일 형식 오류, 비밀번호 8자 미만 (실제 페이지에서 확인)',
    url: '/login',
  },
} as const;

export default function LoginDemoPage() {
  const [state, setState] = useState<keyof typeof DEMO_STATES>('normal');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">P1-S1-T1: 로그인 페이지 데모</h1>
          <p className="mt-2 text-muted-foreground">
            로그인 페이지의 다양한 상태를 확인할 수 있습니다.
          </p>
        </div>

        {/* State Selector */}
        <Card>
          <CardHeader>
            <CardTitle>상태 선택</CardTitle>
            <CardDescription>테스트하려는 상태를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DEMO_STATES) as Array<keyof typeof DEMO_STATES>).map((s) => (
                <Button
                  key={s}
                  onClick={() => setState(s)}
                  variant={state === s ? 'default' : 'outline'}
                  size="sm"
                >
                  {s}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current State Info */}
        <Card>
          <CardHeader>
            <CardTitle>현재 상태: {state}</CardTitle>
            <CardDescription>{DEMO_STATES[state].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">실제 페이지 접근:</h3>
              <Link href={DEMO_STATES[state].url}>
                <Button>로그인 페이지 열기</Button>
              </Link>
            </div>

            <div className="rounded-md bg-slate-100 p-4">
              <h3 className="mb-2 font-semibold">상태별 테스트 가이드:</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>normal:</strong> 기본 폼이 정상적으로 렌더링되는지 확인
                </li>
                <li>
                  <strong>loading:</strong> 로그인 버튼 클릭 시 spinner와 disabled 상태 확인
                </li>
                <li>
                  <strong>error:</strong> 잘못된 이메일/비밀번호 입력 시 에러 메시지 표시 확인
                </li>
                <li>
                  <strong>validation:</strong> 이메일 형식 오류, 비밀번호 8자 미만 입력 시 유효성 검사 메시지 확인
                </li>
              </ul>
            </div>

            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">테스트 시나리오:</h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
                <li>이메일 필드에 잘못된 형식 입력 (예: &quot;test&quot;) → 유효성 검사 에러 확인</li>
                <li>비밀번호 필드에 7자 입력 (예: &quot;1234567&quot;) → 유효성 검사 에러 확인</li>
                <li>유효한 이메일과 비밀번호 입력 후 로그인 버튼 클릭 → 로딩 상태 확인</li>
                <li>잘못된 자격증명 입력 → 로그인 실패 에러 메시지 확인</li>
                <li>회원가입 링크 클릭 → /signup 페이지로 이동 확인</li>
                <li>Google 로그인 버튼 → disabled 상태 확인</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* State Details */}
        <Card>
          <CardHeader>
            <CardTitle>상태 세부 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-slate-950 p-4 text-sm text-slate-50 overflow-x-auto">
              {JSON.stringify(DEMO_STATES[state], null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Component Features */}
        <Card>
          <CardHeader>
            <CardTitle>구현된 기능</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>react-hook-form + zod 유효성 검사</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>이메일 형식 검사 (정규식)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>비밀번호 최소 8자 검사</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>useAuthStore login 액션 호출</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>로딩 상태 (버튼 disabled + spinner)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>에러 메시지 표시 (로그인 실패 시)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>로그인 성공 시 /dashboard 리다이렉트</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Google 로그인 버튼 (UI만, disabled)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>회원가입 링크 (/signup)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>카드 레이아웃, 센터 정렬</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>반응형 디자인 (모바일 우선)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>ARIA 접근성 (aria-invalid, aria-describedby, role=alert)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>shadcn/ui 컴포넌트 사용 (Button, Input, Card, Label)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

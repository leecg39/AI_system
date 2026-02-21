'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 정보 콘솔 로깅
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    // 페이지 새로고침으로 다시 시도
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
          <div className="w-full max-w-2xl space-y-6">
            {/* 메인 에러 카드 */}
            <div className="rounded-lg border-[3px] border-red-600 bg-white p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
              {/* 아이콘 및 제목 */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-[3px] border-red-600 bg-red-100 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <span className="text-4xl">⚠️</span>
                </div>
                <div>
                  <h1 className="text-3xl font-black text-foreground">
                    앗! 문제가 발생했습니다
                  </h1>
                  <p className="mt-1 text-sm font-bold text-muted-foreground">
                    예상치 못한 오류가 발생했어요
                  </p>
                </div>
              </div>

              {/* 에러 메시지 */}
              {this.state.error && (
                <div className="mb-6 rounded-lg border-[3px] border-gray-300 bg-gray-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                    오류 내용
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {/* 안내 메시지 */}
              <div className="mb-6 space-y-2">
                <p className="font-bold text-foreground">
                  다음과 같은 방법을 시도해보세요:
                </p>
                <ul className="ml-6 list-disc space-y-1 text-sm font-medium text-muted-foreground">
                  <li>페이지를 새로고침하여 다시 시도</li>
                  <li>잠시 후 다시 접속</li>
                  <li>문제가 계속되면 관리자에게 문의</li>
                </ul>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  size="lg"
                >
                  다시 시도
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  홈으로 이동
                </Button>
              </div>
            </div>

            {/* 개발 모드에서만 스택 트레이스 표시 */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="rounded-lg border-[3px] border-gray-300 bg-white p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <summary className="cursor-pointer font-bold text-foreground hover:text-primary">
                  개발자 정보 (스택 트레이스)
                </summary>
                <pre className="mt-4 overflow-auto rounded border border-gray-200 bg-gray-50 p-4 text-xs">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

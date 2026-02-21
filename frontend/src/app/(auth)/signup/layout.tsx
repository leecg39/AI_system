import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입',
  description: '계정을 생성하여 AI 에이전트 팀 플랫폼을 시작하세요',
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

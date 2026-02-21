import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  description: '이메일과 비밀번호를 입력하여 로그인하세요',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import { redirect } from "next/navigation";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '작업 관리',
  description: 'AI 에이전트 작업을 관리하고 모니터링합니다',
};

export default function TasksPage() {
  redirect("/tasks/history");
}

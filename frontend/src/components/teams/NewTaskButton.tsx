import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NewTaskButtonProps {
  teamId: string;
}

export function NewTaskButton({ teamId }: NewTaskButtonProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="새 작업 요청">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">새 작업 요청</h2>
          <p className="text-sm text-slate-600">URL 또는 파일 기반 작업을 3단계로 요청합니다.</p>
        </div>
        <Button asChild>
          <Link href={`/teams/${teamId}/tasks/new`}>새 작업 요청</Link>
        </Button>
      </div>
    </section>
  );
}

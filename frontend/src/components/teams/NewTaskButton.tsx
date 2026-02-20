import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NewTaskButtonProps {
  teamId: string;
}

export function NewTaskButton({ teamId }: NewTaskButtonProps) {
  return (
    <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" aria-label="새 작업 요청">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-foreground">새 작업 요청</h2>
          <p className="text-sm text-muted-foreground">URL 또는 파일 기반 작업을 3단계로 요청합니다.</p>
        </div>
        <Button asChild>
          <Link href={`/teams/${teamId}/tasks/new`}>새 작업 요청</Link>
        </Button>
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";

export function NewTaskButton() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="새 작업 요청">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">새 작업 요청</h2>
          <p className="text-sm text-slate-600">작업 요청 기능은 Phase 3에서 활성화됩니다.</p>
        </div>
        <Button type="button" disabled>
          새 작업 요청 (Coming soon)
        </Button>
      </div>
    </section>
  );
}

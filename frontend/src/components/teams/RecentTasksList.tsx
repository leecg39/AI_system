export function RecentTasksList() {
  return (
    <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" aria-label="최근 작업">
      <h2 className="text-lg font-black text-foreground">최근 작업</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        최근 작업 목록은 Phase 3 Tasks 리소스 연동 후 표시됩니다.
      </p>
    </section>
  );
}

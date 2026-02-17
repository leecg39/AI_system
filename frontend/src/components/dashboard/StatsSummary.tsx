import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types/dashboard";

interface StatsSummaryProps {
  stats: DashboardStats;
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  const cards = [
    {
      label: "진행 중 작업",
      value: stats.running_tasks,
      color: "text-blue-600",
    },
    {
      label: "오늘 완료",
      value: stats.completed_tasks_today,
      color: "text-emerald-600",
    },
    {
      label: "전체 팀",
      value: stats.total_teams,
      color: "text-violet-600",
    },
  ];

  return (
    <section aria-label="오늘의 요약" className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">오늘의 요약</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

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
      color: "text-accent",
    },
    {
      label: "오늘 완료",
      value: stats.completed_tasks_today,
      color: "text-accent",
    },
    {
      label: "전체 팀",
      value: stats.total_teams,
      color: "text-accent",
    },
  ];

  return (
    <section aria-label="오늘의 요약" className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">오늘의 요약</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground">{card.label}</CardTitle>
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

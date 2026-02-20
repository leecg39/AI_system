import type { DashboardStats } from "@/types/dashboard";

interface StatsSummaryProps {
  stats: DashboardStats;
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  const cards = [
    {
      label: "진행 중 작업",
      value: stats.running_tasks,
      emoji: "🔄",
      bg: "bg-blue-50",
      border: "border-blue-600",
    },
    {
      label: "오늘 완료",
      value: stats.completed_tasks_today,
      emoji: "✅",
      bg: "bg-green-50",
      border: "border-green-600",
    },
    {
      label: "전체 팀",
      value: stats.total_teams,
      emoji: "👥",
      bg: "bg-purple-50",
      border: "border-purple-600",
    },
  ];

  return (
    <section aria-label="오늘의 요약" className="space-y-3">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-lg border-[3px] ${card.border} p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">{card.label}</p>
              <span className="text-2xl">{card.emoji}</span>
            </div>
            <p className="mt-2 text-4xl font-black text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import type { Team } from "@/types/team";

interface TeamHeaderProps {
  team: Team;
}

const statusLabel: Record<string, string> = {
  active: "활성",
  paused: "일시중지",
  archived: "보관",
};

const statusClassName: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-700",
  paused: "bg-amber-100 text-amber-700 border-amber-700",
  archived: "bg-slate-200 text-slate-700 border-slate-700",
};

export function TeamHeader({ team }: TeamHeaderProps) {
  const label = statusLabel[team.status] ?? team.status;
  const className = statusClassName[team.status] ?? "bg-slate-200 text-slate-700";

  return (
    <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" aria-label="팀 헤더">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground">{team.name}</h1>
          <p className="text-muted-foreground">{team.description || "팀 설명이 아직 없습니다."}</p>
          <span className={`inline-flex border-[2px] px-3 py-1 text-xs font-bold ${className}`}>
            {label}
          </span>
        </div>

        <Button type="button" variant="outline">
          팀 설정
        </Button>
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import type { TeamTemplate } from "@/types/template";

interface TemplateGridProps {
  templates: TeamTemplate[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
}

const categoryColor: Record<string, string> = {
  마케팅: "bg-pink-100 text-pink-700 border-pink-400",
  재무: "bg-emerald-100 text-emerald-700 border-emerald-400",
  전략: "bg-blue-100 text-blue-700 border-blue-400",
  교육: "bg-yellow-100 text-yellow-700 border-yellow-400",
  이커머스: "bg-orange-100 text-orange-700 border-orange-400",
  고객서비스: "bg-purple-100 text-purple-700 border-purple-400",
  인사: "bg-teal-100 text-teal-700 border-teal-400",
  법무: "bg-slate-100 text-slate-700 border-slate-400",
  데이터: "bg-cyan-100 text-cyan-700 border-cyan-400",
  연구개발: "bg-indigo-100 text-indigo-700 border-indigo-400",
};

export function TemplateGrid({ templates, selectedTemplateId, onSelect }: TemplateGridProps) {
  return (
    <section aria-label="템플릿 선택" className="space-y-3">
      <h2 className="text-lg font-black text-foreground">템플릿 선택</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          const colorClass = categoryColor[template.category] || "bg-gray-100 text-gray-700 border-gray-400";
          return (
            <article
              key={template.id}
              className={`border-[3px] bg-white p-5 transition-all hover:-translate-y-0.5 ${
                isSelected
                  ? "border-blue-600 shadow-[6px_6px_0_0_rgba(37,99,235,0.5)]"
                  : "border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="text-base font-black text-foreground">{template.name}</h3>
                <span
                  className={`inline-block border-[2px] px-2 py-0.5 text-[11px] font-bold ${colorClass}`}
                >
                  {template.category}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{template.description || "설명 없음"}</p>
              <p className="mt-3 text-xs font-bold text-foreground">
                👥 기본 에이전트 {template.default_agents.length}명
              </p>

              <div className="mt-4">
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full font-bold ${
                    isSelected
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border-[2px] border-foreground shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  }`}
                  onClick={() => onSelect(template.id)}
                >
                  {isSelected ? "✓ 선택됨" : "이 템플릿 선택"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

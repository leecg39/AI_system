import { Button } from "@/components/ui/button";
import type { TeamTemplate } from "@/types/template";

interface TemplateGridProps {
  templates: TeamTemplate[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
}

export function TemplateGrid({ templates, selectedTemplateId, onSelect }: TemplateGridProps) {
  return (
    <section aria-label="템플릿 선택" className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">템플릿 선택</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          return (
            <article
              key={template.id}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                isSelected ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200"
              }`}
            >
              <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{template.description || "설명 없음"}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {template.category}
              </p>
              <p className="mt-2 text-xs text-slate-500">기본 에이전트 {template.default_agents.length}명</p>

              <div className="mt-4">
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onSelect(template.id)}
                >
                  {isSelected ? "선택됨" : "이 템플릿 선택"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

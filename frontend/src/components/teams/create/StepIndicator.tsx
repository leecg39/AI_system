interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { id: 1, label: "템플릿 선택" },
  { id: 2, label: "커스터마이즈" },
  { id: 3, label: "확인" },
] as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="팀 생성 단계">
      {steps.map((step) => {
        const isCurrent = step.id === currentStep;
        const isDone = step.id < currentStep;

        return (
          <li
            key={step.id}
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              isCurrent
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : isDone
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
              {step.id}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

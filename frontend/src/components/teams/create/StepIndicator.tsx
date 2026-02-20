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
            className={`border-[3px] px-4 py-3 text-sm font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all ${
              isCurrent
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : isDone
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-foreground bg-white text-muted-foreground"
            }`}
          >
            <span
              className={`mr-2 inline-flex h-6 w-6 items-center justify-center text-xs font-black ${
                isCurrent
                  ? "rounded-full bg-blue-600 text-white"
                  : isDone
                    ? "rounded-full bg-green-600 text-white"
                    : "rounded-full border-[2px] border-foreground"
              }`}
            >
              {isDone ? "✓" : step.id}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

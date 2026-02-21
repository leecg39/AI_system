import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 py-4">
      <header className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-96" />
      </header>

      {/* Profile Section Skeleton */}
      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <Skeleton className="h-7 w-24 mb-1" />
        <Skeleton className="h-5 w-80 mb-4" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </section>

      {/* API Key Section Skeleton */}
      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <Skeleton className="h-7 w-32 mb-1" />
        <Skeleton className="h-5 w-72 mb-4" />

        <div className="space-y-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>

        <Skeleton className="h-3 w-48 mt-2 mb-4" />

        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </section>

      {/* Subscription Section Skeleton */}
      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <Skeleton className="h-7 w-32 mb-1" />
        <Skeleton className="h-5 w-80 mb-4" />

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center border-b-[2px] border-dashed border-foreground/20 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </section>

      {/* Notification Section Skeleton */}
      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <Skeleton className="h-7 w-32 mb-1" />
        <Skeleton className="h-5 w-96 mb-4" />

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-10" />
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Skeleton className="h-10 w-40" />
        </div>
      </section>

      {/* Data Management Section Skeleton */}
      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <Skeleton className="h-7 w-32 mb-1" />
        <Skeleton className="h-5 w-80 mb-4" />

        <div className="flex flex-wrap justify-end gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </section>
    </div>
  );
}

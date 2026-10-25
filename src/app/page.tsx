import { Suspense } from "react";
import { getDashboardData } from "@/lib/actions";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";

export const instant = false;

async function DashboardDataLoader() {
  const data = await getDashboardData();
  return <DashboardView initialData={data} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/70 p-6 space-y-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-64 bg-slate-200" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 bg-slate-200" />
                <Skeleton className="h-9 w-28 bg-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Skeleton className="h-24 rounded-xl bg-slate-200" />
              <Skeleton className="h-24 rounded-xl bg-slate-200" />
              <Skeleton className="h-24 rounded-xl bg-slate-200" />
              <Skeleton className="h-24 rounded-xl bg-slate-200" />
            </div>

            <Skeleton className="h-96 rounded-xl bg-slate-200" />
          </div>
        </div>
      }
    >
      <DashboardDataLoader />
    </Suspense>
  );
}

import { useThemeMode } from "@/app/useThemeMode";
import { useMemo, useState } from "react";
import { useVixData } from "../api/useVixData";
import type { IntervalKey } from "../types";
import { calculateStats, makeCloseTrendData, makeDailyDistributionData, makeMicrostructureReport } from "../utils/statistics";
import { CloseTrendChart } from "./CloseTrendChart";
import { DailyDistributionChart } from "./DailyDistributionChart";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardStatus } from "./DashboardStatus";
import { MicrostructureReportPanel } from "./MicrostructureReportPanel";
import { RecentObservationsTable } from "./RecentObservationsTable";
import { SummaryCards } from "./SummaryCards";
import { VixChat } from "./VixChat";

export function VixDashboard() {
  const [interval, setInterval] = useState<IntervalKey>("5m");
  const { mode, toggleMode } = useThemeMode();
  const { data, error, loading } = useVixData();
  const points = data?.series[interval] ?? [];
  const stats = useMemo(() => calculateStats(points), [points]);
  const closeTrendData = useMemo(() => makeCloseTrendData(points, interval), [points, interval]);
  const dailyDistributionData = useMemo(() => makeDailyDistributionData(points), [points]);
  const microstructureReport = useMemo(() => makeMicrostructureReport(points, interval), [points, interval]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground xl:grid xl:h-screen xl:grid-rows-[auto_minmax(0,1fr)] xl:overflow-hidden">
      <DashboardHeader data={data} interval={interval} onIntervalChange={setInterval} themeMode={mode} onThemeToggle={toggleMode} />

      <div className="grid w-full gap-2 overflow-x-hidden p-2 xl:min-h-0 xl:grid-cols-[minmax(0,3fr)_minmax(320px,1fr)] xl:overflow-hidden">
        <section className="min-w-0 overflow-x-hidden xl:min-h-0 xl:overflow-auto">
          {loading ? <DashboardStatus type="loading" /> : null}
          {error ? <DashboardStatus type="error" message={error} /> : null}
          {!loading && !error && points.length === 0 ? <DashboardStatus type="empty" /> : null}

          {!loading && !error && points.length > 0 ? (
            <div className="grid gap-2">
              <MicrostructureReportPanel report={microstructureReport} />
              <SummaryCards stats={stats} />
              <div className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.72fr)_minmax(320px,0.62fr)]">
                <CloseTrendChart data={closeTrendData} interval={interval} stats={stats} />
                <DailyDistributionChart data={dailyDistributionData} />
                <div className="min-h-0 lg:col-span-2 2xl:col-span-1">
                  <RecentObservationsTable points={points} />
                </div>
              </div>
            </div>
          ) : null}
        </section>
        <aside className="min-w-0 xl:min-h-0">
          <VixChat data={data} />
        </aside>
      </div>
    </main>
  );
}

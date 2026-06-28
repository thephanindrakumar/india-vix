import { DATA_URL } from "@/app/config";
import { CalendarClock, Database, Download } from "lucide-react";
import { formatTimestamp } from "../utils/formatters";
import { IntervalSelector } from "./IntervalSelector";
import { ThemeToggle } from "./ThemeToggle";
import type { IntervalKey, VixDataFile } from "../types";

type DashboardHeaderProps = {
  data: VixDataFile | null;
  interval: IntervalKey;
  onIntervalChange: (interval: IntervalKey) => void;
  themeMode: "light" | "dark";
  onThemeToggle: () => void;
};

export function DashboardHeader({ data, interval, onIntervalChange, themeMode, onThemeToggle }: DashboardHeaderProps) {
  return (
    <section className="border-b bg-card">
      <div className="flex h-full w-full flex-col items-start gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Database className="size-4" aria-hidden="true" />
              Yahoo Finance · {data?.metadata.symbol ?? "^INDIAVIX"}
            </div>
              <h1 className="text-lg font-semibold tracking-normal text-foreground sm:text-xl">India VIX Dashboard</h1>
            </div>
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-4" aria-hidden="true" />
            Generated {formatTimestamp(data?.metadata.generated_at)}
          </span>
            <span className="hidden sm:inline">Static JSON refreshes after commit + Pages deploy</span>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-start">
          <IntervalSelector value={interval} onChange={onIntervalChange} />
          <div className="flex items-center gap-2">
            <ThemeToggle mode={themeMode} onToggle={onThemeToggle} />
            <a
              className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary"
              href={DATA_URL}
              download
              title="Download the JSON dataset used by this dashboard."
            >
              <Download className="size-4" aria-hidden="true" />
              JSON
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

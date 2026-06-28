import { formatIsoMinute, formatPercent, formatSignedPercent, formatValue } from "../utils/formatters";
import type { MicrostructureReport, TimeSlotMove } from "../types";

type MicrostructureReportPanelProps = {
  report: MicrostructureReport;
};

export function MicrostructureReportPanel({ report }: MicrostructureReportPanelProps) {
  const latest = report.latestBar;

  return (
    <div className="grid min-h-0 max-w-full gap-2 lg:grid-cols-2 2xl:grid-cols-[1.25fr_0.82fr_0.72fr]">
      <section className="min-w-0 rounded-lg border bg-card p-3 shadow-sm lg:col-span-2 2xl:col-span-1 2xl:min-h-0">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">{report.title}</h2>
            <p className="text-xs text-muted-foreground">
              {formatIsoMinute(report.startTimestamp)} to {formatIsoMinute(report.endTimestamp)} · {report.tradingDays} sessions · {report.bars} bars
            </p>
          </div>
          {latest ? (
            <div
              className="text-right text-xs text-muted-foreground"
              title={`Latest stored ${report.barLabel} candle. Compare close against open to understand the most recent bar direction.`}
            >
              <div>{formatIsoMinute(latest.timestamp)}</div>
              <div>
                O {formatValue(latest.open)} H {formatValue(latest.high)} L {formatValue(latest.low)} C {formatValue(latest.close)}
              </div>
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">Metric</th>
                <th className="px-2 py-1.5 text-right font-medium">Mean</th>
                <th className="px-2 py-1.5 text-right font-medium">Median</th>
                <th className="px-2 py-1.5 text-right font-medium">P05</th>
                <th className="px-2 py-1.5 text-right font-medium">P95</th>
              </tr>
            </thead>
            <tbody>
              {report.keyStats.map((row) => (
                <tr key={row.metric} className="border-t" title={row.interpretation}>
                  <td className="px-2 py-1.5 font-medium">{row.metric}</td>
                  <td className="px-2 py-1.5 text-right">{formatPercent(row.mean)}</td>
                  <td className="px-2 py-1.5 text-right">{formatPercent(row.median)}</td>
                  <td className="px-2 py-1.5 text-right">{formatPercent(row.p05)}</td>
                  <td className="px-2 py-1.5 text-right">{formatPercent(row.p95)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="min-w-0 rounded-lg border bg-card p-3 shadow-sm 2xl:min-h-0">
        <h2 className="mb-2 text-base font-semibold">Opening Drift</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">Move</th>
                <th className="px-2 py-1.5 text-right font-medium">Mean</th>
                <th className="px-2 py-1.5 text-right font-medium">Median</th>
                <th className="px-2 py-1.5 text-right font-medium">P05</th>
                <th className="px-2 py-1.5 text-right font-medium">P95</th>
              </tr>
            </thead>
            <tbody>
              {report.openingBehavior.map((row) => (
                <tr key={row.horizon} className="border-t" title={row.interpretation}>
                  <td className="px-2 py-1.5 font-medium">{row.horizon}</td>
                  <td className="px-2 py-1.5 text-right">{formatPercent(row.mean)}</td>
                  <td className="px-2 py-1.5 text-right">{formatPercent(row.median)}</td>
                  <td className="px-2 py-1.5 text-right">{formatPercent(row.p05)}</td>
                  <td className="px-2 py-1.5 text-right">{formatPercent(row.p95)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="min-w-0 rounded-lg border bg-card p-3 text-xs shadow-sm">
        <h2 className="mb-2 text-base font-semibold">{report.strengthLabel}</h2>
        <SlotList
          label="Rise"
          tone="rise"
          items={report.strongestRiseSlots}
          title={`Top 3 slots with the highest average close-to-previous-close return across the stored ${report.barLabel} sample.`}
        />
        <SlotList
          label="Fall"
          tone="fall"
          items={report.strongestFallSlots}
          title={`Top 3 slots with the lowest average close-to-previous-close return across the stored ${report.barLabel} sample.`}
        />
        <p className="mt-2 text-muted-foreground" title="Small samples can be dominated by a few unusual days.">
          {report.caveat}
        </p>
      </section>
    </div>
  );
}

function SlotList({ label, tone, items, title }: { label: string; tone: "rise" | "fall"; items: TimeSlotMove[]; title: string }) {
  const toneClass = tone === "rise" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300";

  return (
    <div className="mt-1" title={title}>
      <div className={`font-medium ${toneClass}`}>{label}</div>
      <div className="mt-1 grid gap-1">
        {items.map((item, index) => (
          <div key={item.slot} className="grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2">
            <span className="text-muted-foreground">{index + 1}</span>
            <span className="truncate">{item.slot}</span>
            <span className="text-right">
              {formatSignedPercent(item.averageReturn)} · {item.observations}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { formatTimestamp, formatValue } from "../utils/formatters";
import { getClose } from "../utils/statistics";
import type { VixPoint } from "../types";

type RecentObservationsTableProps = {
  points: VixPoint[];
};

export function RecentObservationsTable({ points }: RecentObservationsTableProps) {
  const recent = [...points].slice(-7).reverse();

  return (
    <div className="flex max-h-96 min-h-0 flex-col rounded-lg border bg-card p-3 shadow-sm xl:h-full xl:max-h-none">
      <h2 className="mb-2 text-sm font-semibold">Latest Bars</h2>
      <div className="min-h-0 flex-1 overflow-auto rounded-md border">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary text-xs uppercase text-secondary-foreground">
            <tr>
              <th className="px-2 py-1.5 font-medium">Time</th>
              <th className="px-2 py-1.5 text-right font-medium">Close</th>
              <th className="px-2 py-1.5 text-right font-medium">High</th>
              <th className="px-2 py-1.5 text-right font-medium">Low</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((point) => (
              <tr
                key={point.timestamp}
                className="border-t"
                title="Recent selected-interval candle. Close is the final VIX value for that bar."
              >
                <td className="px-2 py-1.5 text-muted-foreground">{formatTimestamp(point.timestamp, false)}</td>
                <td className="px-2 py-1.5 text-right font-medium">{formatValue(getClose(point))}</td>
                <td className="px-2 py-1.5 text-right">{formatValue(point.high)}</td>
                <td className="px-2 py-1.5 text-right">{formatValue(point.low)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

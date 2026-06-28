import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatChartTick, formatCompact, formatSignedValue } from "../utils/formatters";
import { ChartTooltip, timestampTooltipTitle } from "./ChartTooltip";
import type { CloseTrendPoint, IntervalKey, VixStats } from "../types";

type CloseTrendChartProps = {
  data: CloseTrendPoint[];
  interval: IntervalKey;
  stats: VixStats;
};

export function CloseTrendChart({ data, interval, stats }: CloseTrendChartProps) {
  const changeTone = stats.change == null ? "text-muted-foreground" : stats.change >= 0 ? "text-red-700" : "text-emerald-700";

  return (
    <div className="flex h-80 min-h-0 flex-col rounded-lg border bg-card p-3 shadow-sm sm:h-96 xl:h-auto">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Close Path</h2>
          <p className="text-xs text-muted-foreground">
            {formatCompact(stats.count)} observations in the {interval} series
          </p>
        </div>
        <div
          className={`text-xs font-medium ${changeTone}`}
          title="Last close minus previous close in the selected interval. Positive means VIX rose on the latest bar."
        >
          {formatSignedValue(stats.change)}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="closeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.42} strokeDasharray="2 6" vertical={false} />
            <XAxis
              dataKey="index"
              type="number"
              domain={["dataMin", "dataMax"]}
              minTickGap={34}
              tickFormatter={(value) => {
                const point = data[Math.round(Number(value))];
                return point ? formatChartTick(point.timestamp, interval === "1m" ? "intraday" : "date") : "";
              }}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={40} fontSize={11} />
            <Tooltip
              content={<ChartTooltip labelFormatter={timestampTooltipTitle} />}
              cursor={{ stroke: "var(--border)", strokeOpacity: 0.7, strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="var(--primary)"
              fill="url(#closeFill)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

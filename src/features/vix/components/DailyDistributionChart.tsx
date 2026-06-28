import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip, dayTooltipTitle } from "./ChartTooltip";
import type { DailyDistributionPoint } from "../types";

type DailyDistributionChartProps = {
  data: DailyDistributionPoint[];
};

export function DailyDistributionChart({ data }: DailyDistributionChartProps) {
  return (
    <div className="flex h-80 min-h-0 flex-col rounded-lg border bg-card p-3 shadow-sm sm:h-96 xl:h-auto">
      <div className="mb-2">
        <h2 className="text-sm font-semibold">Daily Profile</h2>
        <p className="text-xs text-muted-foreground">Last 30 trading days from selected interval.</p>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.42} strokeDasharray="2 6" vertical={false} />
            <XAxis
              dataKey="index"
              type="number"
              domain={["dataMin", "dataMax"]}
              minTickGap={24}
              tickFormatter={(value) => data[Math.round(Number(value))]?.day ?? ""}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={40} fontSize={11} />
            <Tooltip
              content={<ChartTooltip labelFormatter={dayTooltipTitle} />}
              cursor={{ stroke: "var(--border)", strokeOpacity: 0.7, strokeWidth: 1 }}
            />
            <Line type="monotone" dataKey="average" stroke="var(--primary)" strokeWidth={2} dot={false} name="Average" isAnimationActive={false} />
            <Line type="monotone" dataKey="high" stroke="oklch(0.55 0.14 34)" strokeWidth={1.5} dot={false} name="High" isAnimationActive={false} />
            <Line type="monotone" dataKey="low" stroke="oklch(0.5 0.11 165)" strokeWidth={1.5} dot={false} name="Low" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

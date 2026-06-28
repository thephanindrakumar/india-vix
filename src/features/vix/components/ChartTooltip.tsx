import { formatTimestamp, formatValue } from "../utils/formatters";

type TooltipPayload = {
  name?: string;
  value?: number | string | null;
  color?: string;
  payload?: {
    timestamp?: string;
    day?: string;
  };
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  labelFormatter?: (payload: TooltipPayload[], label?: string | number) => string;
};

export function ChartTooltip({ active, payload = [], label, labelFormatter }: ChartTooltipProps) {
  if (!active || payload.length === 0) return null;

  const title = labelFormatter ? labelFormatter(payload, label) : String(label ?? "");

  return (
    <div className="min-w-32 rounded-md border bg-card px-2.5 py-2 text-xs text-card-foreground shadow-lg">
      <div className="mb-1 border-b pb-1 font-medium text-muted-foreground">{title}</div>
      <div className="grid gap-1">
        {payload.map((item) => (
          <div key={item.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color ?? "var(--primary)" }} />
            <span>{item.name}</span>
            <span className="font-medium">{formatValue(Number(item.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function timestampTooltipTitle(payload: TooltipPayload[]) {
  return formatTimestamp(payload[0]?.payload?.timestamp);
}

export function dayTooltipTitle(payload: TooltipPayload[]) {
  return payload[0]?.payload?.day ?? "";
}

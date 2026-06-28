import type { IntervalKey } from "../types";

type IntervalSelectorProps = {
  value: IntervalKey;
  onChange: (value: IntervalKey) => void;
};

const intervals: IntervalKey[] = ["1m", "5m", "15m", "60m"];

export function IntervalSelector({ value, onChange }: IntervalSelectorProps) {
  return (
    <div className="inline-flex rounded-md border bg-background p-0.5">
      {intervals.map((interval) => (
        <button
          key={interval}
          type="button"
          className={`h-7 rounded px-2.5 text-xs font-medium transition ${
            value === interval ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
          title={`${intervalLabel(interval)} bars and statistics`}
          onClick={() => onChange(interval)}
        >
          {intervalLabel(interval)}
        </button>
      ))}
    </div>
  );
}

function intervalLabel(interval: IntervalKey) {
  return interval === "60m" ? "1h" : interval;
}

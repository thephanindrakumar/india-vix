const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export function formatValue(value: number | null | undefined) {
  return value == null ? "N/A" : numberFormatter.format(value);
}

export function formatCompact(value: number | null | undefined) {
  return value == null ? "N/A" : compactFormatter.format(value);
}

export function formatSignedValue(value: number | null | undefined) {
  if (value == null) return "N/A";
  return `${value > 0 ? "+" : ""}${formatValue(value)}`;
}

export function formatPercent(value: number | null | undefined) {
  if (value == null) return "N/A";
  return `${value.toFixed(3)}%`;
}

export function formatSignedPercent(value: number | null | undefined) {
  if (value == null) return "N/A";
  return `${value > 0 ? "+" : ""}${formatPercent(value)}`;
}

export function formatTimestamp(value: string | null | undefined, withDate = true) {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: withDate ? "medium" : undefined,
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function formatIsoMinute(value: string | null | undefined) {
  if (!value) return "N/A";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day} ${lookup.hour}:${lookup.minute} IST`;
}

export function formatChartTick(value: string | null | undefined, mode: "intraday" | "date") {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: mode === "date" ? "2-digit" : undefined,
    month: mode === "date" ? "short" : undefined,
    hour: "2-digit",
    minute: mode === "intraday" ? "2-digit" : undefined,
    hour12: true,
  }).format(new Date(value));
}

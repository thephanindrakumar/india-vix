import { formatChartTick } from "./formatters";
import type {
  CloseTrendPoint,
  DailyDistributionPoint,
  DistributionStats,
  MicrostructureReport,
  OpeningBehavior,
  IntervalKey,
  VixPoint,
  VixStats,
} from "../types";

export function getClose(point: VixPoint) {
  return point.close ?? point.adj_close;
}

export function calculateStats(points: VixPoint[]): VixStats {
  const closes = points.map(getClose).filter((value): value is number => value != null);
  const latest = [...points].reverse().find((point) => getClose(point) != null) ?? null;
  const latestIndex = latest ? points.indexOf(latest) : -1;
  const previous =
    latestIndex > 0
      ? [...points]
          .slice(0, latestIndex)
          .reverse()
          .find((point) => getClose(point) != null) ?? null
      : null;

  if (closes.length === 0) {
    return emptyStats(points.length, latest, previous);
  }

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const average = closes.reduce((sum, value) => sum + value, 0) / closes.length;
  const variance = closes.reduce((sum, value) => sum + (value - average) ** 2, 0) / closes.length;
  const latestClose = latest ? getClose(latest) : null;
  const previousClose = previous ? getClose(previous) : null;
  const change = latestClose != null && previousClose != null ? latestClose - previousClose : null;

  return {
    latest,
    previous,
    count: points.length,
    min,
    max,
    average,
    standardDeviation: Math.sqrt(variance),
    range: max - min,
    change,
    changePercent: change != null && previousClose ? (change / previousClose) * 100 : null,
  };
}

export function makeCloseTrendData(points: VixPoint[], interval: IntervalKey): CloseTrendPoint[] {
  const maxPoints = 220;
  const tickMode = interval === "60m" ? "date" : "intraday";

  return points
    .slice(-maxPoints)
    .map((point, index) => ({
      index,
      timestamp: point.timestamp,
      time: new Date(point.timestamp).getTime(),
      label: formatChartTick(point.timestamp, tickMode),
      close: getClose(point),
      high: point.high,
      low: point.low,
    }));
}

export function makeDailyDistributionData(points: VixPoint[]): DailyDistributionPoint[] {
  const groups = new Map<string, number[]>();

  for (const point of points) {
    const close = getClose(point);
    if (close == null) continue;

    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(point.timestamp));

    groups.set(day, [...(groups.get(day) ?? []), close]);
  }

  return [...groups.entries()].slice(-30).map(([day, values], index) => ({
    index,
    day,
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    high: Math.max(...values),
    low: Math.min(...values),
  }));
}

export function makeMicrostructureReport(points: VixPoint[], interval: IntervalKey): MicrostructureReport {
  const sorted = points.filter((point) => getClose(point) != null).sort(compareByTimestamp);
  const dayGroups = groupByTradingDay(sorted);
  const config = intervalConfig(interval);

  return {
    interval,
    title: `${config.label} Return Profile`,
    barLabel: config.label,
    strengthLabel: `Strongest ${config.slotName} Slots`,
    startTimestamp: sorted[0]?.timestamp ?? null,
    endTimestamp: sorted.at(-1)?.timestamp ?? null,
    tradingDays: dayGroups.size,
    bars: sorted.length,
    latestBar: sorted.at(-1) ?? null,
    keyStats: makeDistributionStats(sorted, config.label),
    openingBehavior: makeOpeningBehavior(dayGroups, interval),
    strongestRiseSlots: makePeriodSeasonality(dayGroups, interval, "rise"),
    strongestFallSlots: makePeriodSeasonality(dayGroups, interval, "fall"),
    caveat: `This is ${dayGroups.size} sessions from the ${config.label} sample, so use it for available-data behavior rather than long-term seasonality.`,
  };
}

function emptyStats(count: number, latest: VixPoint | null, previous: VixPoint | null): VixStats {
  return {
    latest,
    previous,
    count,
    min: null,
    max: null,
    average: null,
    standardDeviation: null,
    range: null,
    change: null,
    changePercent: null,
  };
}

function makeDistributionStats(points: VixPoint[], barLabel: string): DistributionStats[] {
  const openToClose = points
    .map((point) => percentChange(point.open, getClose(point)))
    .filter((value): value is number => value != null);

  const closeToPreviousClose = points
    .map((point, index) => percentChange(index > 0 ? getClose(points[index - 1]) : null, getClose(point)))
    .filter((value): value is number => value != null);

  const highLowRange = points
    .map((point) => (point.open && point.high != null && point.low != null ? ((point.high - point.low) / point.open) * 100 : null))
    .filter((value): value is number => value != null);

  return [
    summarizeDistribution(`${barLabel} open-to-close`, openToClose, `Positive means VIX often closed above that ${barLabel} bar's open; negative means fading.`),
    summarizeDistribution(
      `${barLabel} close-to-prev-close`,
      closeToPreviousClose,
      `Shows ${barLabel} momentum from the previous close; P05/P95 mark the common downside/upside tails.`,
    ),
    summarizeDistribution(`${barLabel} high-low range`, highLowRange, `Measures typical ${barLabel} high-low spread as a percent of open.`),
  ];
}

function makeOpeningBehavior(dayGroups: Map<string, VixPoint[]>, interval: IntervalKey): OpeningBehavior[] {
  const config = intervalConfig(interval);

  return config.openingHorizons.map((horizon) => {
    const moves = [...dayGroups.values()]
      .map((points) => {
        const open = points[0]?.open;
        const target = points[config.horizonToIndex(horizon)];
        const close = target ? getClose(target) : null;
        return percentChange(open, close);
      })
      .filter((value): value is number => value != null);

    return {
      horizon: `Open to ${horizon}${config.horizonSuffix}`,
      mean: mean(moves),
      median: percentile(moves, 0.5),
      p05: percentile(moves, 0.05),
      p95: percentile(moves, 0.95),
      interpretation: `Average move from the session open to ${horizon}${config.horizonSuffix}; positive means VIX usually rose after the open.`,
    };
  });
}

function makePeriodSeasonality(dayGroups: Map<string, VixPoint[]>, interval: IntervalKey, direction: "rise" | "fall") {
  const config = intervalConfig(interval);
  const returnsByPeriod = new Map<string, number[]>();

  for (const points of dayGroups.values()) {
    for (let index = 1; index < points.length; index += 1) {
      const point = points[index];
      const previous = points[index - 1];
      const value = percentChange(getClose(previous), getClose(point));
      if (value == null) continue;

      const period = config.slotLabel(point.timestamp);
      returnsByPeriod.set(period, [...(returnsByPeriod.get(period) ?? []), value]);
    }
  }

  return [...returnsByPeriod.entries()]
    .map(([slot, values]) => ({ slot, averageReturn: mean(values) ?? 0, observations: values.length }))
    .sort((a, b) => (direction === "rise" ? b.averageReturn - a.averageReturn : a.averageReturn - b.averageReturn))
    .slice(0, 3);
}

function summarizeDistribution(metric: string, values: number[], interpretation: string): DistributionStats {
  return {
    metric,
    mean: mean(values),
    median: percentile(values, 0.5),
    p05: percentile(values, 0.05),
    p95: percentile(values, 0.95),
    interpretation,
  };
}

function groupByTradingDay(points: VixPoint[]) {
  const groups = new Map<string, VixPoint[]>();
  for (const point of points) {
    const day = dayLabel(point.timestamp);
    groups.set(day, [...(groups.get(day) ?? []), point]);
  }
  return groups;
}

function percentChange(start: number | null | undefined, end: number | null | undefined) {
  if (start == null || end == null || start === 0) return null;
  return ((end - start) / start) * 100;
}

function mean(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], quantile: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * quantile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function dayLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function timeLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function hourLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hour12: true,
  }).format(new Date(timestamp));
}

function intervalConfig(interval: IntervalKey) {
  const configs = {
    "1m": {
      label: "1m",
      slotName: "minute",
      horizonSuffix: "m",
      openingHorizons: [1, 5, 15, 30, 60],
      horizonToIndex: (horizon: number) => horizon - 1,
      slotLabel: timeLabel,
    },
    "5m": {
      label: "5m",
      slotName: "5-minute",
      horizonSuffix: "m",
      openingHorizons: [5, 15, 30, 60, 120],
      horizonToIndex: (horizon: number) => Math.ceil(horizon / 5) - 1,
      slotLabel: timeLabel,
    },
    "15m": {
      label: "15m",
      slotName: "15-minute",
      horizonSuffix: "m",
      openingHorizons: [15, 30, 60, 120, 240],
      horizonToIndex: (horizon: number) => Math.ceil(horizon / 15) - 1,
      slotLabel: timeLabel,
    },
    "60m": {
      label: "1h",
      slotName: "hour",
      horizonSuffix: "h",
      openingHorizons: [1, 2, 3, 4, 6],
      horizonToIndex: (horizon: number) => horizon - 1,
      slotLabel: hourLabel,
    },
  } satisfies Record<
    IntervalKey,
    {
      label: string;
      slotName: string;
      horizonSuffix: string;
      openingHorizons: number[];
      horizonToIndex: (horizon: number) => number;
      slotLabel: (timestamp: string) => string;
    }
  >;

  return configs[interval];
}

function compareByTimestamp(a: VixPoint, b: VixPoint) {
  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
}

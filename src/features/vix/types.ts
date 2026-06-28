export type IntervalKey = "1m" | "5m" | "15m" | "60m";
export type InstrumentKey = "india_vix" | "nifty_50";

export type VixPoint = {
  timestamp: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  adj_close: number | null;
  volume: number | null;
};

export type VixDataFile = {
  metadata: {
    symbol: string;
    symbols?: Partial<Record<InstrumentKey, string>>;
    generated_at: string | null;
    source: string;
    timezone: string;
    intervals: string[];
    notes?: string[];
  };
  series: Record<IntervalKey, VixPoint[]>;
  instruments?: Partial<Record<InstrumentKey, InstrumentData>>;
};

export type InstrumentData = {
  name: string;
  symbol: string;
  series: Record<IntervalKey, VixPoint[]>;
};

export type VixStats = {
  latest: VixPoint | null;
  previous: VixPoint | null;
  count: number;
  min: number | null;
  max: number | null;
  average: number | null;
  standardDeviation: number | null;
  range: number | null;
  change: number | null;
  changePercent: number | null;
};

export type CloseTrendPoint = {
  index: number;
  timestamp: string;
  time: number;
  label: string;
  close: number | null;
  high: number | null;
  low: number | null;
};

export type DailyDistributionPoint = {
  index: number;
  day: string;
  average: number;
  high: number;
  low: number;
};

export type DistributionStats = {
  metric: string;
  mean: number | null;
  median: number | null;
  p05: number | null;
  p95: number | null;
  interpretation: string;
};

export type OpeningBehavior = {
  horizon: string;
  mean: number | null;
  median: number | null;
  p05: number | null;
  p95: number | null;
  interpretation: string;
};

export type TimeSlotMove = {
  slot: string;
  averageReturn: number;
  observations: number;
};

export type MicrostructureReport = {
  interval: IntervalKey;
  title: string;
  barLabel: string;
  strengthLabel: string;
  startTimestamp: string | null;
  endTimestamp: string | null;
  tradingDays: number;
  bars: number;
  latestBar: VixPoint | null;
  keyStats: DistributionStats[];
  openingBehavior: OpeningBehavior[];
  strongestRiseSlots: TimeSlotMove[];
  strongestFallSlots: TimeSlotMove[];
  caveat: string;
};

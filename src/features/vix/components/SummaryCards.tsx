import { Activity, BarChart3, Sigma, TrendingDown, TrendingUp } from "lucide-react";
import { formatSignedValue, formatTimestamp, formatValue } from "../utils/formatters";
import { getClose } from "../utils/statistics";
import { StatCard } from "./StatCard";
import type { VixStats } from "../types";

type SummaryCardsProps = {
  stats: VixStats;
};

export function SummaryCards({ stats }: SummaryCardsProps) {
  const latestClose = stats.latest ? getClose(stats.latest) : null;
  const changeIcon = stats.change != null && stats.change >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="grid min-h-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Activity} label="Latest Close" value={formatValue(latestClose)} detail={formatTimestamp(stats.latest?.timestamp)} />
      <StatCard
        icon={changeIcon}
        label="Last Bar Move"
        value={formatSignedValue(stats.change)}
        detail={`${formatSignedValue(stats.changePercent)}% from previous close`}
      />
      <StatCard icon={Sigma} label="Center / Spread" value={formatValue(stats.average)} detail={`${formatValue(stats.standardDeviation)} std dev`} />
      <StatCard icon={BarChart3} label="Observed Range" value={formatValue(stats.range)} detail={`${formatValue(stats.min)} low · ${formatValue(stats.max)} high`} />
    </div>
  );
}

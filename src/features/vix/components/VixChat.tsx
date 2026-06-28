import { Bot, KeyRound, Loader2, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import type { InstrumentData, InstrumentKey, IntervalKey, VixDataFile, VixPoint } from "../types";
import { formatIsoMinute, formatSignedPercent, formatValue } from "../utils/formatters";
import { calculateStats, getClose, makeMicrostructureReport } from "../utils/statistics";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const SESSION_KEY = "india-vix-openrouter-key";
const MODEL_SESSION_KEY = "india-vix-openrouter-model";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const CONVERSATION_WINDOW_CHARS = 6000;

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type VixChatProps = {
  data: VixDataFile | null;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type DailyOpeningMove = {
  day: string;
  open: number;
  moves: Record<string, number | null>;
};

type ContextPlan = {
  instruments: InstrumentKey[];
  intervals: IntervalKey[];
  includeDailyOpeningMoves: boolean;
  includeTimeSlots: boolean;
  includeStats: boolean;
  includeLatestBars: boolean;
  threshold: number | null;
};

export function VixChat({ data }: VixChatProps) {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? "");
  const [draftKey, setDraftKey] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? "");
  const [model, setModel] = useState(() => sessionStorage.getItem(MODEL_SESSION_KEY) ?? DEFAULT_MODEL);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Ask about VIX/NIFTY moves, strongest time slots, opening drift, or interval statistics from the stored dataset.",
    },
  ]);
  function saveKey() {
    const trimmed = draftKey.trim();
    if (!trimmed) return;
    sessionStorage.setItem(SESSION_KEY, trimmed);
    setApiKey(trimmed);
    setError(null);
  }

  function clearKey() {
    sessionStorage.removeItem(SESSION_KEY);
    setApiKey("");
    setDraftKey("");
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || busy) return;
    if (!apiKey) {
      setError("Add your OpenRouter API key first. It is stored only in this browser session.");
      return;
    }

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const conversationWindow = buildConversationWindow(messages, content);
      const planningText = `${conversationWindow.map((message) => `${message.role}: ${message.content}`).join("\n")}\nuser: ${content}`;
      const contextPlan = data ? planContext(planningText) : null;
      const dataContext = data && contextPlan ? buildFilteredMarketContext(data, contextPlan) : "Dataset is not loaded yet.";
      const response = await fetch(OPENROUTER_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "India VIX Dashboard",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 700,
          messages: [
            {
              role: "system",
              content:
                "You are a concise market-statistics assistant for an India VIX dashboard. Use only the supplied filtered JSON-derived context and the rolling conversation window. Resolve follow-up wording like 'same', 'those days', 'what about NIFTY', or 'for 5m' from the conversation window. Cover only the instruments and intervals present in the context unless the user asks for missing data. For threshold questions, use the precomputed threshold rows and name exact dates. Explain statistical interpretation clearly. Do not provide financial advice or trade instructions. If the filtered context is insufficient, say what extra data/metric would be needed.",
            },
            {
              role: "user",
              content: `Filtered market context selected locally from the question:\n${dataContext}`,
            },
            ...conversationWindow.map((message) => ({ role: message.role, content: message.content })),
            { role: "user", content },
          ],
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as OpenRouterResponse;
      if (!response.ok) {
        throw new Error(payload.error?.message ?? `OpenRouter request failed with ${response.status}`);
      }

      const answer = payload.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new Error("OpenRouter returned an empty response.");

      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: answer }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send chat request.");
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex h-[620px] min-h-0 w-full flex-col rounded-lg border bg-card shadow-sm xl:h-full">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Bot className="size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Market Chat</h2>
            <p className="truncate text-[11px] text-muted-foreground">BYOK · Filtered Context</p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 border-b p-3">
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
            type="password"
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="OpenRouter API key"
            aria-label="OpenRouter API key"
          />
          <button className="rounded-md border bg-background p-2 hover:bg-secondary" type="button" onClick={saveKey} title="Save key for this session">
            <KeyRound className="size-4" aria-hidden="true" />
          </button>
          <button className="rounded-md border bg-background p-2 hover:bg-secondary" type="button" onClick={clearKey} title="Forget session key">
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
        <input
          className="rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
          value={model}
          onChange={(event) => {
            const nextModel = event.target.value;
            setModel(nextModel);
            if (nextModel.trim()) {
              sessionStorage.setItem(MODEL_SESSION_KEY, nextModel.trim());
            } else {
              sessionStorage.removeItem(MODEL_SESSION_KEY);
            }
          }}
          aria-label="OpenRouter model"
          title="OpenRouter model slug"
        />
        <p className="text-[11px] text-muted-foreground">
          {apiKey ? "Key saved in sessionStorage. Sends filtered market context plus a rolling chat window." : "Your key stays in sessionStorage and is sent only to OpenRouter."}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[92%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs leading-relaxed ${
              message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {message.content}
          </div>
        ))}
        {busy ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground">
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            Thinking
          </div>
        ) : null}
      </div>

      {error ? <div className="border-t px-3 py-2 text-xs text-destructive">{error}</div> : null}

      <div className="flex gap-2 border-t p-3">
        <textarea
          className="max-h-24 min-h-10 flex-1 resize-none rounded-md border bg-background px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          placeholder="Ask about VIX vs NIFTY movement..."
          aria-label="Chat message"
        />
        <button
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={() => void sendMessage()}
          disabled={busy || !input.trim()}
          title="Send message"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function buildConversationWindow(messages: ChatMessage[], nextUserMessage: string) {
  const selected: ChatMessage[] = [];
  let used = nextUserMessage.length;

  for (const message of [...messages].reverse()) {
    const cost = message.content.length + message.role.length + 8;
    if (used + cost > CONVERSATION_WINDOW_CHARS) break;
    selected.unshift(message);
    used += cost;
  }

  return selected;
}

function planContext(question: string): ContextPlan {
  const normalized = question.toLowerCase();
  const asksVix = /\bvix\b|india vix|indiavix/.test(normalized);
  const asksNifty = /\bnifty\b|nsei|index/.test(normalized);
  const intervals = selectIntervals(normalized);
  const threshold = extractThreshold(normalized);
  const includeDailyOpeningMoves = /which day|which days|daily|date|session|open to|opening|threshold|more than|greater than|above|less than|below/.test(normalized);
  const includeTimeSlots = /slot|time|minute|hour|rise|fall|strongest|weakest|top/.test(normalized);
  const includeLatestBars = /latest|recent|last bar|current|close/.test(normalized);
  const includeStats = !includeDailyOpeningMoves || /mean|median|p05|p95|percentile|stat|range|std|standard|distribution|average/.test(normalized);

  return {
    instruments: asksVix && !asksNifty ? ["india_vix"] : asksNifty && !asksVix ? ["nifty_50"] : ["india_vix", "nifty_50"],
    intervals,
    includeDailyOpeningMoves,
    includeTimeSlots,
    includeStats,
    includeLatestBars,
    threshold,
  };
}

function selectIntervals(question: string): IntervalKey[] {
  const selected: IntervalKey[] = [];
  if (/\b1\s*m\b|\b1min\b|\b1 minute\b|\bone minute\b/.test(question)) selected.push("1m");
  if (/\b5\s*m\b|\b5min\b|\b5 minute\b|\bfive minute\b/.test(question)) selected.push("5m");
  if (/\b15\s*m\b|\b15min\b|\b15 minute\b|\bfifteen minute\b/.test(question)) selected.push("15m");
  if (/\b1\s*h\b|\b1hr\b|\b1 hour\b|\bone hour\b|\b60\s*m\b|\b60min\b/.test(question)) selected.push("60m");
  return selected.length ? selected : ["5m"];
}

function extractThreshold(question: string) {
  const match = question.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
}

function buildFilteredMarketContext(data: VixDataFile, plan: ContextPlan) {
  const instruments = getInstruments(data).filter(([key]) => plan.instruments.includes(key));
  const lines = [
    `Generated: ${data.metadata.generated_at ?? "unknown"}`,
    `Timezone: ${data.metadata.timezone}`,
    `Context plan: instruments=${plan.instruments.join(", ")}, intervals=${plan.intervals.join(", ")}, sections=${[
      plan.includeStats ? "stats" : null,
      plan.includeDailyOpeningMoves ? "daily_opening_moves" : null,
      plan.includeTimeSlots ? "time_slots" : null,
      plan.includeLatestBars ? "latest_bars" : null,
    ]
      .filter(Boolean)
      .join(", ")}`,
    `Threshold requested: ${plan.threshold == null ? "none" : `${plan.threshold}%`}`,
  ];

  for (const [key, instrument] of instruments) {
    lines.push("");
    lines.push(`${instrument.name} (${instrument.symbol}, key=${key})`);
    for (const interval of plan.intervals) {
      const points = instrument.series[interval] ?? [];
      lines.push(formatIntervalContext(points, interval, plan));
    }
  }

  return lines.join("\n");
}

function getInstruments(data: VixDataFile): Array<[InstrumentKey, InstrumentData]> {
  const indiaVix: InstrumentData = data.instruments?.india_vix ?? {
    name: "India VIX",
    symbol: data.metadata.symbol,
    series: data.series,
  };
  const instruments: Array<[InstrumentKey, InstrumentData]> = [["india_vix", indiaVix]];

  if (data.instruments?.nifty_50) {
    instruments.push(["nifty_50", data.instruments.nifty_50]);
  }

  return instruments;
}

function formatIntervalContext(points: VixPoint[], interval: IntervalKey, plan: ContextPlan) {
  if (points.length === 0) return `${interval}: no observations`;

  const stats = calculateStats(points);
  const report = makeMicrostructureReport(points, interval);
  const latest = stats.latest;
  const latestClose = latest ? getClose(latest) : null;
  const recent = points.slice(-3).map((point) => {
    const close = getClose(point);
    return `${formatIsoMinute(point.timestamp)} O ${formatValue(point.open)} H ${formatValue(point.high)} L ${formatValue(point.low)} C ${formatValue(close)}`;
  });
  const dailyOpeningMoves = makeDailyOpeningMoves(points, interval);
  const lines = [`${interval}: ${report.bars} bars, ${report.tradingDays} sessions, ${formatIsoMinute(report.startTimestamp)} to ${formatIsoMinute(report.endTimestamp)}`];

  if (plan.includeStats) {
    lines.push(`  latest close ${formatValue(latestClose)} at ${formatIsoMinute(latest?.timestamp)}; last bar move ${formatValue(stats.change)} (${formatSignedPercent(stats.changePercent)})`);
    lines.push(`  close range ${formatValue(stats.min)}-${formatValue(stats.max)}, mean ${formatValue(stats.average)}, std dev ${formatValue(stats.standardDeviation)}`);
    lines.push(
      `  return stats: ${report.keyStats
        .map((row) => `${row.metric} mean ${formatSignedPercent(row.mean)}, median ${formatSignedPercent(row.median)}, P05 ${formatSignedPercent(row.p05)}, P95 ${formatSignedPercent(row.p95)}`)
        .join("; ")}`,
    );
    lines.push(
      `  opening drift aggregate: ${report.openingBehavior
        .map((row) => `${row.horizon} mean ${formatSignedPercent(row.mean)}, median ${formatSignedPercent(row.median)}, P05 ${formatSignedPercent(row.p05)}, P95 ${formatSignedPercent(row.p95)}`)
        .join("; ")}`,
    );
  }

  if (plan.includeTimeSlots) {
    lines.push(`  strongest rise slots: ${report.strongestRiseSlots.map((slot) => `${slot.slot} ${formatSignedPercent(slot.averageReturn)} n=${slot.observations}`).join(", ")}`);
    lines.push(`  strongest fall slots: ${report.strongestFallSlots.map((slot) => `${slot.slot} ${formatSignedPercent(slot.averageReturn)} n=${slot.observations}`).join(", ")}`);
  }

  if (plan.includeDailyOpeningMoves) {
    lines.push(formatDailyOpeningSummary(dailyOpeningMoves, interval, plan.threshold));
  }

  if (plan.includeLatestBars) {
    lines.push(`  latest bars: ${recent.join(" | ")}`);
  }

  return lines.join("\n");
}

function makeDailyOpeningMoves(points: VixPoint[], interval: IntervalKey): DailyOpeningMove[] {
  const horizons = openingHorizons(interval);
  const groups = new Map<string, VixPoint[]>();

  for (const point of points.filter((item) => getClose(item) != null).sort(compareByTimestamp)) {
    const day = dayLabel(point.timestamp);
    groups.set(day, [...(groups.get(day) ?? []), point]);
  }

  return [...groups.entries()].map(([day, dayPoints]) => {
    const open = dayPoints[0]?.open;
    const moves = Object.fromEntries(
      horizons.map((horizon) => {
        const target = dayPoints[horizonToIndex(horizon, interval)];
        return [`Open to ${horizon.label}`, percentChange(open, target ? getClose(target) : null)];
      }),
    );

    return {
      day,
      open: open ?? 0,
      moves,
    };
  });
}

function formatDailyOpeningSummary(rows: DailyOpeningMove[], interval: IntervalKey, threshold: number | null) {
  if (rows.length === 0) return "  daily opening moves: none";

  const fifteenMinuteLabel = interval === "60m" ? "Open to 1h" : "Open to 15m";
  const requestedThreshold = threshold ?? 7.5;
  const overThreshold = rows.filter((row) => (row.moves[fifteenMinuteLabel] ?? Number.NEGATIVE_INFINITY) > requestedThreshold);
  const renderedRows = rows
    .map((row) => {
      const moves = Object.entries(row.moves)
        .map(([label, value]) => `${label} ${formatSignedPercent(value)}`)
        .join(", ");
      return `${row.day} open ${formatValue(row.open)}: ${moves}`;
    })
    .join(" | ");

  return [
    `  daily opening moves by session: ${renderedRows}`,
    `  precomputed threshold check: ${fifteenMinuteLabel} > ${formatSignedPercent(requestedThreshold)} days = ${
      overThreshold.length ? overThreshold.map((row) => `${row.day} (${formatSignedPercent(row.moves[fifteenMinuteLabel])})`).join(", ") : "none"
    }`,
  ].join("\n");
}

function openingHorizons(interval: IntervalKey) {
  if (interval === "1m") return [{ value: 1, label: "1m" }, { value: 5, label: "5m" }, { value: 15, label: "15m" }, { value: 30, label: "30m" }, { value: 60, label: "60m" }];
  if (interval === "5m") return [{ value: 5, label: "5m" }, { value: 15, label: "15m" }, { value: 30, label: "30m" }, { value: 60, label: "60m" }, { value: 120, label: "120m" }];
  if (interval === "15m") return [{ value: 15, label: "15m" }, { value: 30, label: "30m" }, { value: 60, label: "60m" }, { value: 120, label: "120m" }, { value: 240, label: "240m" }];
  return [{ value: 1, label: "1h" }, { value: 2, label: "2h" }, { value: 3, label: "3h" }, { value: 4, label: "4h" }, { value: 6, label: "6h" }];
}

function horizonToIndex(horizon: { value: number }, interval: IntervalKey) {
  if (interval === "1m") return horizon.value - 1;
  if (interval === "5m") return Math.ceil(horizon.value / 5) - 1;
  if (interval === "15m") return Math.ceil(horizon.value / 15) - 1;
  return horizon.value - 1;
}

function compareByTimestamp(left: VixPoint, right: VixPoint) {
  return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
}

function dayLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function percentChange(start: number | null | undefined, end: number | null | undefined) {
  if (start == null || end == null || start === 0) return null;
  return ((end - start) / start) * 100;
}

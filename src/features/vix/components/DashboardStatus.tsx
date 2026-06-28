type DashboardStatusProps = {
  type: "loading" | "error" | "empty";
  message?: string;
};

const content = {
  loading: {
    title: null,
    body: "Loading dashboard data...",
    className: "text-muted-foreground",
  },
  error: {
    title: null,
    body: "Unable to load VIX data",
    className: "border-destructive/40 text-destructive",
  },
  empty: {
    title: "No VIX observations yet",
    body: "Run `python3 scripts/update_vix_data.py`, then rebuild or push to GitHub Pages. The dashboard will render automatically after `public/data/india-vix.json` contains observations.",
    className: "",
  },
};

export function DashboardStatus({ type, message }: DashboardStatusProps) {
  const item = content[type];

  return (
    <div className={`rounded-lg border bg-card p-8 shadow-sm ${item.className}`}>
      {item.title ? <div className="text-lg font-semibold">{item.title}</div> : null}
      <p className={`${item.title ? "mt-2 max-w-2xl leading-6" : ""} text-sm`}>{message ?? item.body}</p>
    </div>
  );
}

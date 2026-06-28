import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, detail, icon: Icon }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-xs font-medium text-muted-foreground">{label}</div>
        <div className="grid size-7 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-2 truncate text-xl font-semibold tracking-normal">{value}</div>
      <div className="truncate text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

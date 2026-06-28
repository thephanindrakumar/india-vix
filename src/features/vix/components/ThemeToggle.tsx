import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  mode: "light" | "dark";
  onToggle: () => void;
};

export function ThemeToggle({ mode, onToggle }: ThemeToggleProps) {
  const Icon = mode === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      className="grid size-8 place-items-center rounded-md border bg-background text-foreground hover:bg-secondary"
      onClick={onToggle}
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

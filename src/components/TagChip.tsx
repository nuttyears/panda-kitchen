import type { MacroTag } from "@/lib/types";
import { Beef, Carrot, Apple } from "lucide-react";

const meta: Record<MacroTag, { label: string; color: string; Icon: typeof Beef }> = {
  protein: { label: "Protein", color: "var(--protein)", Icon: Beef },
  veggie: { label: "Veggie", color: "var(--veggie)", Icon: Carrot },
  fruit: { label: "Fruit", color: "var(--fruit)", Icon: Apple },
};

export function TagChip({
  tag,
  small,
  muted,
}: {
  tag: MacroTag;
  small?: boolean;
  muted?: boolean;
}) {
  const { label, color, Icon } = meta[tag];
  return (
    <span
      className="tag-chip"
      style={
        muted
          ? { background: "var(--muted)", color: "var(--muted-foreground)" }
          : {
              background: `color-mix(in oklab, ${color} 18%, transparent)`,
              color: `color-mix(in oklab, ${color} 70%, var(--foreground))`,
            }
      }
    >
      <Icon className={small ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {!small && label}
    </span>
  );
}

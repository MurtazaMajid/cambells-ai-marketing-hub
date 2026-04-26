import type { SpendingTier, TimePreference, FoodPreference, DrinkVsFood } from "@/lib/api";

const TIER_STYLES: Record<SpendingTier, string> = {
  Economy: "bg-white/[0.06] text-muted-foreground border border-white/[0.12]",
  Standard: "bg-blue/15 text-[oklch(0.75_0.11_247)] border border-[oklch(0.55_0.11_247)]/40",
  Premium: "bg-yellow/15 text-[oklch(0.85_0.12_85)] border border-[oklch(0.65_0.15_85)]/50",
};

const TIME_EMOJI: Record<TimePreference, string> = {
  Morning: "☀️",
  "Mid-day": "🕛",
  Evening: "🌙",
};

const FOOD_EMOJI: Record<FoodPreference, string> = {
  chicken: "🍗",
  beef: "🥩",
  fish: "🐟",
  veggie: "🥗",
  varied: "🍽️",
};

export function SpendingTierBadge({ value }: { value: SpendingTier }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${TIER_STYLES[value] ?? TIER_STYLES.Standard}`}>
      💎 {value}
    </span>
  );
}

export function TimePreferenceBadge({ value }: { value: TimePreference }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.06] border border-border-strong">
      {TIME_EMOJI[value] ?? "⏱️"} {value}
    </span>
  );
}

export function FoodPreferenceBadge({ value }: { value: FoodPreference }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.06] border border-border-strong capitalize">
      {FOOD_EMOJI[value] ?? "🍽️"} {value}
    </span>
  );
}

export function DrinkVsFoodBadge({ value }: { value: DrinkVsFood }) {
  const icon = value === "Drinks" ? "🍹" : value === "Food" ? "🍴" : "🍽️";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.06] border border-border-strong">
      {icon} {value}
    </span>
  );
}

export function FlightLoverBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-orange/15 text-orange border border-orange/40">
      ✈️ Flight Lover
    </span>
  );
}

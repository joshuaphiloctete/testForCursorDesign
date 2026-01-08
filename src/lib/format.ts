export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value >= 1 ? 2 : 6,
    }).format(value);
  } catch {
    // Fallback if Intl is unavailable
    const digits = value >= 1 ? 2 : 6;
    return `$${value.toFixed(digits)}`;
  }
}

export function formatPct(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}


export function formatHTG(amount: number): string {
  return `${new Intl.NumberFormat("fr-HT", {
    maximumFractionDigits: 0,
  }).format(amount)} HTG`;
}

export function formatBusinessDate(value: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-HT", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function formatBusinessDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-HT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Port-au-Prince",
  }).format(date);
}

"use client";

import { useEffect, useState } from "react";

import {
  getDashboardSummary,
  type DailyActivity,
  type DashboardSummary,
  type PeriodKey,
} from "@/lib/business-api";
import { formatBusinessDate, formatHTG } from "@/lib/business-format";
import { useWorkspaceUser } from "../WorkspaceShell";

const periods: { key: PeriodKey; label: string; shortLabel: string }[] = [
  { key: "7days", label: "7 dènye jou", shortLabel: "7 jou" },
  { key: "month", label: "Mwa sa a", shortLabel: "Mwa sa" },
  { key: "30days", label: "30 dènye jou", shortLabel: "30 jou" },
];

const activitySeries = [
  { key: "revenue_htg", label: "Chif dafè", color: "#397b56" },
  { key: "expenses_htg", label: "Depans", color: "#d99524" },
] as const;

function compactHTG(value: number): string {
  return new Intl.NumberFormat("fr-HT", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function DailyActivityChart({
  data,
  isLoading,
}: {
  data: DailyActivity[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <p className="workspace-empty px-5 py-10 text-center text-sm">
        Ap chaje aktivite chak jou...
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <p className="workspace-empty px-5 py-10 text-center text-sm">
        Graf aktivite a poko disponib.
      </p>
    );
  }

  const chartWidth = 720;
  const chartHeight = 240;
  const chartTop = 12;
  const chartBottom = chartHeight - 12;
  const maxAmount = Math.max(
    1,
    ...data.flatMap((day) => [day.revenue_htg, day.expenses_htg]),
  );
  const pointX = (index: number) =>
    8 + (index / Math.max(data.length - 1, 1)) * (chartWidth - 16);
  const pointY = (value: number) =>
    chartTop +
    ((maxAmount - value) / maxAmount) * (chartBottom - chartTop);
  const labelIndexes = [
    0,
    Math.floor((data.length - 1) / 2),
    data.length - 1,
  ].filter((index, position, indexes) => indexes.indexOf(index) === position);
  const hasActivity = data.some(
    (day) =>
      day.revenue_htg > 0 || day.expenses_htg > 0 || day.sales_count > 0,
  );

  return (
    <figure className="workspace-trend-figure">
      <div className="workspace-trend-legend" aria-hidden="true">
        {activitySeries.map((series) => (
          <span key={series.key} className="workspace-trend-legend-item">
            <span
              className="workspace-trend-legend-mark"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </span>
        ))}
      </div>

      <div className="workspace-trend-chart">
        <div className="workspace-trend-y-axis" aria-hidden="true">
          <span>{compactHTG(maxAmount)}</span>
          <span>{compactHTG(maxAmount / 2)}</span>
          <span>0</span>
        </div>
        <div className="workspace-trend-plot">
          <svg
            className="workspace-trend-svg"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            role="img"
            aria-labelledby="daily-activity-title daily-activity-description"
          >
            <title id="daily-activity-title">
              Chif dafè ak depans pou chak jou
            </title>
            <desc id="daily-activity-description">
              {hasActivity
                ? `Graf pou ${data.length} jou.`
                : "Pa gen chif dafè ni depans pou peryòd sa a."}
            </desc>
            {[chartTop, (chartTop + chartBottom) / 2, chartBottom].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                className="workspace-trend-gridline"
              />
            ))}

            {activitySeries.map((series) => (
              <g key={series.key}>
                <polyline
                  points={data
                    .map(
                      (day, index) =>
                        `${pointX(index)},${pointY(day[series.key])}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {data.map((day, index) => (
                  <circle
                    key={day.date}
                    cx={pointX(index)}
                    cy={pointY(day[series.key])}
                    r="3"
                    fill={series.color}
                    vectorEffect="non-scaling-stroke"
                  >
                    <title>
                      {formatBusinessDate(day.date)} · {series.label}:{" "}
                      {formatHTG(day[series.key])}
                    </title>
                  </circle>
                ))}
              </g>
            ))}
          </svg>
          <div className="workspace-trend-x-axis" aria-hidden="true">
            {labelIndexes.map((index) => (
              <span key={data[index].date}>
                {formatBusinessDate(data[index].date)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!hasActivity && (
        <figcaption className="workspace-muted mt-2 text-center text-xs">
          Pa gen mouvman pou peryòd sa a.
        </figcaption>
      )}
    </figure>
  );
}

export default function DashboardContent() {
  const user = useWorkspaceUser();
  const [period, setPeriod] = useState<PeriodKey>("7days");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const fullName = user.user_metadata.full_name;
  const greetingName =
    typeof fullName === "string" && fullName.trim()
      ? fullName
      : user.email ?? "Itilizatè";

  useEffect(() => {
    const controller = new AbortController();

    void getDashboardSummary(period, controller.signal)
      .then((result) => setSummary(result))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Nou pa ka chaje tablo biznis la.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [period, reloadKey]);

  const periodRange = summary
    ? `${formatBusinessDate(summary.start_date)} – ${formatBusinessDate(summary.end_date)}`
    : "";
  const metrics = [
    {
      label: "Chif dafè",
      value: summary ? formatHTG(summary.revenue_htg) : "—",
      icon: "↗",
      tone: "text-emerald-800 bg-emerald-100",
    },
    {
      label: "Total depans",
      value: summary ? formatHTG(summary.expenses_total_htg) : "—",
      icon: "↘",
      tone: "text-amber-800 bg-amber-100",
    },
    {
      label: "Kantite vant",
      value: summary ? String(summary.sales_count) : "—",
      icon: "≡",
      tone: "text-teal-800 bg-teal-100",
    },
    {
      label: "Stòk ki ba",
      value: summary ? String(summary.low_stock_count) : "—",
      icon: "!",
      tone: "text-orange-800 bg-orange-100",
    },
  ];
  const maxTopQuantity = Math.max(
    1,
    ...(summary?.top_products.map((product) => product.quantity) ?? []),
  );
  const comparisonMax = Math.max(
    summary?.revenue_htg ?? 0,
    summary?.expenses_total_htg ?? 0,
    1,
  );
  const comparison = [
    {
      label: "Chif dafè",
      value: summary?.revenue_htg ?? 0,
      color: "workspace-chart-bar-revenue",
    },
    {
      label: "Depans",
      value: summary?.expenses_total_htg ?? 0,
      color: "workspace-chart-bar-expenses",
    },
  ];

  return (
    <>
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="workspace-section-kicker">Tablo bò</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
            Bonjou, {greetingName}
          </h2>
          <p className="workspace-muted mt-2 text-sm">
            Men yon rezime aktivite biznis ou.
          </p>
        </div>

        <div
          aria-label="Chwazi peryòd rapò a"
          role="group"
          className="workspace-period-selector flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border p-1"
        >
          {periods.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={period === option.key}
              onClick={() => {
                if (period === option.key) return;
                setSummary(null);
                setError("");
                setIsLoading(true);
                setPeriod(option.key);
              }}
              className="workspace-period-button whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm"
            >
              <span className="workspace-period-label">
                {option.label}
              </span>
              <span className="workspace-period-short-label">
                {option.shortLabel}
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="workspace-muted mt-5 text-sm" aria-live="polite">
        {periodRange || "Ap chaje peryòd la..."}
      </p>

      {error && (
        <div
          role="alert"
          className="workspace-api-error mt-4 flex flex-wrap items-center justify-between gap-3"
        >
          <p>{error}</p>
          <button
            type="button"
            className="workspace-retry-button"
            onClick={() => {
              setSummary(null);
              setError("");
              setIsLoading(true);
              setReloadKey((key) => key + 1);
            }}
          >
            Eseye ankò
          </button>
        </div>
      )}

      <section
        aria-label="Endikatè biznis"
        aria-busy={isLoading}
        className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <article key={metric.label} className="workspace-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="workspace-muted text-sm font-semibold">
                {metric.label}
              </h3>
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${metric.tone}`}
              >
                {metric.icon}
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">
              {isLoading ? "…" : metric.value}
            </p>
          </article>
        ))}
      </section>

      <p className="workspace-muted mt-4 text-xs">
        Nòt: chif dafè mwens depans pa vle di benefis nèt kontab.
      </p>

      <section className="mt-6">
        <article className="workspace-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold">Aktivite chak jou</h3>
              <p className="workspace-muted mt-1 text-sm">
                Chif dafè ak depans · {periodRange || "peryòd sa a"}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
              HTG
            </span>
          </div>
          <div className="mt-5" aria-busy={isLoading}>
            <DailyActivityChart
              data={summary?.daily_activity ?? []}
              isLoading={isLoading}
            />
          </div>
        </article>
      </section>

      <section className="mt-6">
        <article className="workspace-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold">Chif dafè ak depans</h3>
              <p className="workspace-muted mt-1 text-sm">
                Konparezon pou {periodRange || "peryòd sa a"}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
              HTG
            </span>
          </div>

          <div
            className="workspace-comparison-chart mt-5"
            role="img"
            aria-label={
              summary
                ? `Konparezon: chif dafè ${formatHTG(summary.revenue_htg)} ak depans ${formatHTG(summary.expenses_total_htg)}`
                : error
                  ? "Done konparezon chif dafè ak depans yo pa disponib"
                  : "Konparezon chif dafè ak depans ap chaje"
            }
            aria-busy={isLoading}
          >
            {comparison.map((item) => (
              <div key={item.label} className="workspace-chart-column">
                <span className="workspace-chart-value">
                  {isLoading ? "…" : formatHTG(item.value)}
                </span>
                <div className="workspace-chart-bar-slot">
                  <span
                    className={`workspace-chart-bar ${item.color}`}
                    style={{
                      height: `${(item.value / comparisonMax) * 100}%`,
                    }}
                  />
                </div>
                <span className="workspace-chart-label">{item.label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-7 grid gap-5 lg:grid-cols-5">
        <article className="workspace-card p-5 shadow-sm lg:col-span-3 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold">Pwodwi ki vann pi plis</h3>
              <p className="workspace-muted mt-1 text-sm">
                {periodRange || "Peryòd la"}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
              HTG
            </span>
          </div>
          <div className="mt-5">
            {isLoading ? (
              <p className="workspace-empty px-5 py-8 text-center text-sm">
                Ap chaje lavant yo...
              </p>
            ) : summary?.top_products.length ? (
              <ul className="divide-y">
                {summary.top_products.map((product) => (
                  <li key={product.product_id} className="py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{product.name}</span>
                      <span className="workspace-muted shrink-0">
                        {product.quantity} vann
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[#e6ede2]">
                      <div
                        className="h-full rounded-full bg-[#47745b]"
                        style={{
                          width: `${Math.max(4, (product.quantity / maxTopQuantity) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="workspace-muted mt-1 text-xs">
                      {formatHTG(product.revenue_htg)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="workspace-empty px-5 py-8 text-center text-sm">
                Pa gen vant pou peryòd sa a.
              </p>
            )}
          </div>
        </article>

        <article className="workspace-card p-5 shadow-sm lg:col-span-2 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 font-bold text-orange-800">
              !
            </span>
            <div>
              <h3 className="text-lg font-bold">Pwodwi ki prèske fini</h3>
              <p className="workspace-muted text-sm">Alèt stock ba</p>
            </div>
          </div>
          <ul className="mt-5 divide-y">
            {isLoading ? (
              <li className="workspace-empty px-5 py-8 text-center text-sm">
                Ap chaje stòk la...
              </li>
            ) : summary?.low_stock_products.length ? (
              summary.low_stock_products.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-semibold">{product.name}</span>
                  <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-900">
                    {product.stock_quantity} rete / min {product.min_stock_quantity}
                  </span>
                </li>
              ))
            ) : (
              <li className="workspace-empty px-5 py-8 text-center text-sm">
                Tout stòk yo bon.
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="workspace-dashboard-cta mt-7 rounded-2xl p-6 sm:p-8">
        <p className="text-sm font-semibold opacity-80">Business Core</p>
        <h2 className="mt-2 text-2xl font-bold">
          Tout biznis ou nan yon sèl espas.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 opacity-80">
          Rezime sa a soti nan lavant, depans ak pwodwi ki anrejistre pou
          biznis ou.
        </p>
      </section>
    </>
  );
}

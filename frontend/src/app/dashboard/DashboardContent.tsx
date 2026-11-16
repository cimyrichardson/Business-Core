"use client";

import { useState } from "react";

import { useWorkspaceUser } from "../WorkspaceShell";

type Period = "7days" | "month" | "30days";

const periods: { key: Period; label: string }[] = [
  { key: "7days", label: "7 dènye jou" },
  { key: "month", label: "Mwa sa a" },
  { key: "30days", label: "30 dènye jou" },
];

const metrics = [
  { label: "Chif dafè", icon: "↗", tone: "text-blue-700 bg-blue-50" },
  { label: "Total depans", icon: "↘", tone: "text-orange-700 bg-orange-50" },
  { label: "Kantite vant", icon: "≡", tone: "text-indigo-700 bg-indigo-50" },
  { label: "Stòk ki ba", icon: "!", tone: "text-red-700 bg-red-50" },
];

function getPeriodRange(period: Period): string {
  const end = new Date();
  const start = new Date(end);

  if (period === "7days") start.setDate(start.getDate() - 6);
  if (period === "30days") start.setDate(start.getDate() - 29);
  if (period === "month") start.setDate(1);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("fr-HT", {
      day: "2-digit",
      month: "short",
    }).format(date);

  return `${formatDate(start)} – ${formatDate(end)}`;
}

export default function DashboardContent() {
  const user = useWorkspaceUser();
  const [period, setPeriod] = useState<Period>("7days");
  const fullName = user.user_metadata.full_name;
  const greetingName =
    typeof fullName === "string" && fullName.trim()
      ? fullName
      : user.email ?? "Itilizatè";

  return (
    <>
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-[#123BFF]">Tablo bò</p>
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
              onClick={() => setPeriod(option.key)}
              className={`workspace-period-button whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                period === option.key
                  ? "bg-[#123BFF] text-white"
                  : "text-gray-600 hover:bg-blue-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <p className="workspace-muted mt-5 text-sm">{getPeriodRange(period)}</p>

      <section
        aria-label="Endikatè biznis"
        className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="workspace-card p-5 shadow-sm"
          >
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
            <p className="mt-4 text-3xl font-bold">—</p>
            <p className="workspace-muted mt-2 text-xs">
              Done yo ap parèt lè API biznis la konekte.
            </p>
          </article>
        ))}
      </section>

      <p className="workspace-muted mt-4 text-xs">
        Nòt: chif dafè mwens depans pa vle di benefis nèt kontab.
      </p>

      <section className="mt-7 grid gap-5 lg:grid-cols-5">
        <article className="workspace-card p-5 shadow-sm lg:col-span-3 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold">Vant sou peryòd la</h3>
              <p className="workspace-muted mt-1 text-sm">
                {getPeriodRange(period)}
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#123BFF]">
              HTG
            </span>
          </div>
          <div className="workspace-empty mt-5 flex min-h-64 items-center justify-center px-6 text-center">
            <p className="max-w-sm text-sm leading-6">
              Pa gen done lavant pou montre kounye a. Konekte API biznis la pou
              wè graf lavant yo.
            </p>
          </div>
        </article>

        <article className="workspace-card p-5 shadow-sm lg:col-span-2 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-700">
              !
            </span>
            <div>
              <h3 className="text-lg font-bold">Pwodwi ki prèske fini</h3>
              <p className="workspace-muted text-sm">Alèt stock ba</p>
            </div>
          </div>
          <div className="workspace-empty mt-5 px-5 py-8 text-center">
            <p className="text-sm">
              Lis pwodwi yo ap parèt lè API biznis la konekte.
            </p>
          </div>
        </article>
      </section>

      <section className="mt-7 rounded-2xl bg-[#123BFF] p-6 text-white sm:p-8">
        <p className="text-sm font-semibold text-blue-100">Business Core</p>
        <h2 className="mt-2 text-2xl font-bold">
          Tout biznis ou nan yon sèl espas.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
          Chif lavant, depans ak stock yo ap disponib lè koneksyon ak API biznis
          la fini.
        </p>
      </section>
    </>
  );
}

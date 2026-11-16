"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  createExpense,
  getExpenses,
  type Expense,
  type PeriodKey,
} from "@/lib/business-api";
import {
  formatBusinessDateTime,
  formatHTG,
} from "@/lib/business-format";
import WorkspaceShell from "../WorkspaceShell";

const periods: { key: PeriodKey; label: string }[] = [
  { key: "7days", label: "7 dènye jou" },
  { key: "month", label: "Mwa sa a" },
  { key: "30days", label: "30 dènye jou" },
];

const categories = [
  "Acha stòk",
  "Transpò",
  "Lwaye",
  "Elektrisite",
  "Salè",
  "Lòt",
];

function getErrorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "Operasyon an pa t reyisi.";
}

export default function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<PeriodKey>("30days");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [spentAt, setSpentAt] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getExpenses(period, controller.signal)
      .then(setExpenses)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [period, reloadKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const parsedAmount = Number(amount);
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount < 1) {
      setError("Montan an dwe yon nonb antye ki pi gran pase zewo.");
      return;
    }

    setIsSaving(true);
    try {
      await createExpense({
        amount_htg: parsedAmount,
        category,
        spent_at: spentAt,
        description: description.trim() || null,
      });
      setAmount("");
      setDescription("");
      setSuccess("Depans lan anrejistre.");
      setIsLoading(true);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  const expensesTotal = expenses.reduce(
    (total, expense) => total + expense.amount_htg,
    0,
  );

  return (
    <WorkspaceShell>
      <section>
        <p className="workspace-section-kicker">Aktivite biznis ou</p>
        <h2 className="mt-2 text-3xl font-bold">Depans</h2>
        <p className="workspace-muted mt-2 max-w-2xl text-sm leading-6">
          Ekri sa biznis la depanse pou rapò yo ka montre tout aktivite a.
        </p>

        <div className="workspace-card mt-7 p-5 shadow-sm sm:p-7">
          <h3 className="text-xl font-bold">Anrejistre yon depans</h3>
          <form
            onSubmit={handleSubmit}
            className="workspace-form mt-5 grid gap-4 sm:grid-cols-2"
          >
            <label className="workspace-field">
              <span>Montan (HTG)</span>
              <input
                className="workspace-input"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>
            <label className="workspace-field">
              <span>Kategori</span>
              <select
                className="workspace-input"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="workspace-field">
              <span>Dat depans lan</span>
              <input
                className="workspace-input"
                type="date"
                value={spentAt}
                onChange={(event) => setSpentAt(event.target.value)}
                required
              />
            </label>
            <label className="workspace-field">
              <span>Nòt (si ou vle)</span>
              <input
                className="workspace-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
              />
            </label>

            {error && (
              <p className="workspace-api-error sm:col-span-2" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="workspace-api-success sm:col-span-2" role="status">
                {success}
              </p>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="workspace-primary-button sm:col-span-2"
            >
              {isSaving ? "Ap anrejistre..." : "Anrejistre depans lan"}
            </button>
          </form>
        </div>

        <div className="workspace-card mt-6 p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">Istwa depans</h3>
              <p className="workspace-muted mt-1 text-sm">
                {isLoading
                  ? "Ap chaje..."
                  : `${expenses.length} depans · total nan lis la ${formatHTG(expensesTotal)}`}
              </p>
            </div>
            <div
              role="group"
              aria-label="Peryòd istwa depans"
              className="workspace-period-selector flex gap-1 overflow-x-auto rounded-xl border p-1"
            >
              {periods.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={period === option.key}
                  className="workspace-period-button whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold"
                  onClick={() => {
                    if (period === option.key) return;
                    setError("");
                    setIsLoading(true);
                    setPeriod(option.key);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="workspace-api-error mt-4" role="alert">
              {error}
            </p>
          )}
          {isLoading ? (
            <p className="workspace-muted mt-6 text-sm">
              Ap chaje depans yo...
            </p>
          ) : expenses.length ? (
            <div className="workspace-table-wrap mt-5">
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th>Dat</th>
                    <th>Kategori</th>
                    <th>Nòt</th>
                    <th>Montan</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatBusinessDateTime(expense.spent_at)}</td>
                      <td>{expense.category}</td>
                      <td>{expense.description || "—"}</td>
                      <td>{formatHTG(expense.amount_htg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !error && (
              <p className="workspace-empty mt-5 px-5 py-8 text-center text-sm">
                Pa gen depans pou peryòd sa a.
              </p>
            )
          )}
        </div>
      </section>
    </WorkspaceShell>
  );
}

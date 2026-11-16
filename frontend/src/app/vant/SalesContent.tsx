"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import {
  createSale,
  getProducts,
  getSales,
  type PeriodKey,
  type Product,
  type Sale,
} from "@/lib/business-api";
import { formatBusinessDateTime, formatHTG } from "@/lib/business-format";
import WorkspaceShell from "../WorkspaceShell";

const periods: { key: PeriodKey; label: string }[] = [
  { key: "7days", label: "7 dènye jou" },
  { key: "month", label: "Mwa sa a" },
  { key: "30days", label: "30 dènye jou" },
];

function getErrorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "Operasyon an pa t reyisi.";
}

export default function SalesContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<PeriodKey>("30days");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.all([
      getProducts(controller.signal),
      getSales(period, controller.signal),
    ])
      .then(([productRows, saleRows]) => {
        setProducts(productRows);
        setSales(saleRows);
        setProductId((current) =>
          current && productRows.some((product) => product.id === current)
            ? current
            : productRows.find((product) => product.is_active)?.id ?? "",
        );
      })
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

    const parsedQuantity = Number(quantity);
    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("Kantite a dwe yon nonb antye ki pi gran pase zewo.");
      return;
    }

    setIsSaving(true);
    try {
      await createSale({
        product_id: productId,
        quantity: parsedQuantity,
        payment_method: paymentMethod || null,
      });
      setSuccess("Vant la anrejistre epi stòk la ajou.");
      setQuantity("1");
      setIsLoading(true);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  const activeProducts = products.filter((product) => product.is_active);

  return (
    <WorkspaceShell>
      <section>
        <p className="workspace-section-kicker">Aktivite biznis ou</p>
        <h2 className="mt-2 text-3xl font-bold">Vant</h2>
        <p className="workspace-muted mt-2 max-w-2xl text-sm leading-6">
          Anrejistre yon vant. Pri a soti nan pwodwi a, epi API a kalkile total
          la ak mete stòk la ajou.
        </p>

        <div className="workspace-card mt-7 p-5 shadow-sm sm:p-7">
          <h3 className="text-xl font-bold">Anrejistre yon vant</h3>
          {activeProducts.length === 0 && !isLoading ? (
            <p className="workspace-empty mt-5 px-5 py-6 text-sm">
              Ajoute yon pwodwi anvan ou anrejistre yon vant.{" "}
              <Link className="workspace-inline-link" href="/pwodwi">
                Ale nan pwodwi yo
              </Link>
              .
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="workspace-form mt-5 grid gap-4 sm:grid-cols-2"
            >
              <label className="workspace-field">
                <span>Pwodwi</span>
                <select
                  className="workspace-input"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  disabled={!activeProducts.length}
                  required
                >
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — {formatHTG(product.unit_price_htg)} (
                      {product.stock_quantity} rete)
                    </option>
                  ))}
                </select>
              </label>
              <label className="workspace-field">
                <span>Kantite</span>
                <input
                  className="workspace-input"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                />
              </label>
              <label className="workspace-field sm:col-span-2">
                <span>Mòd peman</span>
                <select
                  className="workspace-input"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option value="cash">Lajan kach</option>
                  <option value="moncash">MonCash</option>
                  <option value="other">Lòt</option>
                </select>
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
                disabled={isSaving || !activeProducts.length}
                className="workspace-primary-button sm:col-span-2"
              >
                {isSaving ? "Ap anrejistre vant lan..." : "Anrejistre vant la"}
              </button>
            </form>
          )}
          {error && activeProducts.length === 0 && (
            <p className="workspace-api-error mt-4" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="workspace-card mt-6 p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">Istwa lavant</h3>
              <p className="workspace-muted mt-1 text-sm">
                {isLoading ? "Ap chaje..." : `${sales.length} vant nan lis la`}
              </p>
            </div>
            <div
              role="group"
              aria-label="Peryòd istwa lavant"
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

          {isLoading ? (
            <p className="workspace-muted mt-6 text-sm">Ap chaje lavant yo...</p>
          ) : sales.length ? (
            <div className="workspace-table-wrap mt-5">
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th>Dat</th>
                    <th>Pwodwi</th>
                    <th>Kantite</th>
                    <th>Total</th>
                    <th>Peman</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{formatBusinessDateTime(sale.sold_at)}</td>
                      <td>{sale.product_name}</td>
                      <td>{sale.quantity}</td>
                      <td>{formatHTG(sale.total_htg)}</td>
                      <td>{sale.payment_method ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !error && (
              <p className="workspace-empty mt-5 px-5 py-8 text-center text-sm">
                Pa gen vant nan peryòd sa a.
              </p>
            )
          )}
          {error && (
            <p className="workspace-api-error mt-4" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </WorkspaceShell>
  );
}

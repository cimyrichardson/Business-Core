"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createProduct, getProducts, type Product } from "@/lib/business-api";
import { formatHTG } from "@/lib/business-format";
import WorkspaceShell from "../WorkspaceShell";

function getErrorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "Nou pa ka chaje pwodwi yo kounye a.";
}

export default function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [minStockQuantity, setMinStockQuantity] = useState("0");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getProducts(controller.signal)
      .then(setProducts)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const parsedPrice = Number(unitPrice);
    const parsedPurchaseCost = purchaseCost ? Number(purchaseCost) : null;
    const parsedStock = Number(stockQuantity);
    const parsedMinimum = Number(minStockQuantity);
    if (
      !Number.isSafeInteger(parsedPrice) ||
      (parsedPurchaseCost !== null && !Number.isSafeInteger(parsedPurchaseCost)) ||
      !Number.isSafeInteger(parsedStock) ||
      !Number.isSafeInteger(parsedMinimum)
    ) {
      setError("Antre kantite antye an goud pou pri ak stòk yo.");
      return;
    }

    setIsSaving(true);
    try {
      const product = await createProduct({
        name: name.trim(),
        description: description.trim() || null,
        purchase_cost_htg: parsedPurchaseCost,
        unit_price_htg: parsedPrice,
        stock_quantity: parsedStock,
        min_stock_quantity: parsedMinimum,
      });
      setProducts((current) =>
        [...current, product].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setDescription("");
      setPurchaseCost("");
      setUnitPrice("");
      setStockQuantity("0");
      setMinStockQuantity("0");
      setSuccess("Pwodwi a anrejistre.");
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <WorkspaceShell>
      <section>
        <p className="workspace-section-kicker">Envantè biznis ou</p>
        <h2 className="mt-2 text-3xl font-bold">Pwodwi ak stòk</h2>
        <p className="workspace-muted mt-2 max-w-2xl text-sm leading-6">
          Ajoute pwodwi, fikse pri yo, epi swiv kantite ki rete.
        </p>

        <div className="workspace-card mt-7 p-5 shadow-sm sm:p-7">
          <h3 className="text-xl font-bold">Ajoute yon pwodwi</h3>
          <form
            onSubmit={handleSubmit}
            className="workspace-form mt-5 grid gap-4 sm:grid-cols-2"
          >
            <label className="workspace-field">
              <span>Non pwodwi a</span>
              <input
                className="workspace-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                required
              />
            </label>
            <label className="workspace-field">
              <span>Deskripsyon (si ou vle)</span>
              <input
                className="workspace-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <label className="workspace-field">
              <span>Pri vann (HTG)</span>
              <input
                className="workspace-input"
                type="number"
                min="1"
                step="1"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
                required
              />
            </label>
            <label className="workspace-field">
              <span>Pri acha (HTG, si ou konnen li)</span>
              <input
                className="workspace-input"
                type="number"
                min="1"
                step="1"
                value={purchaseCost}
                onChange={(event) => setPurchaseCost(event.target.value)}
              />
            </label>
            <label className="workspace-field">
              <span>Kantite ki nan stòk</span>
              <input
                className="workspace-input"
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(event) => setStockQuantity(event.target.value)}
                required
              />
            </label>
            <label className="workspace-field">
              <span>Alèt lè stòk rive nan</span>
              <input
                className="workspace-input"
                type="number"
                min="0"
                step="1"
                value={minStockQuantity}
                onChange={(event) => setMinStockQuantity(event.target.value)}
                required
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
              {isSaving ? "Ap anrejistre..." : "Anrejistre pwodwi a"}
            </button>
          </form>
        </div>

        <div className="workspace-card mt-6 p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">Lis pwodwi yo</h3>
              <p className="workspace-muted mt-1 text-sm">
                {isLoading ? "Ap chaje..." : `${products.length} pwodwi`}
              </p>
            </div>
            <button
              type="button"
              className="workspace-secondary-button"
              onClick={() => {
                setIsLoading(true);
                setError("");
                setReloadKey((key) => key + 1);
              }}
              disabled={isLoading}
            >
              Rafrechi
            </button>
          </div>

          {error && (
            <p className="workspace-api-error mt-4" role="alert">
              {error}
            </p>
          )}
          {isLoading ? (
            <p className="workspace-muted mt-6 text-sm">
              Ap chaje pwodwi yo...
            </p>
          ) : products.length ? (
            <div className="workspace-table-wrap mt-5">
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th>Pwodwi</th>
                    <th>Pri vann</th>
                    <th>Stòk</th>
                    <th>Alèt</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        {product.description && (
                          <small>{product.description}</small>
                        )}
                      </td>
                      <td>{formatHTG(product.unit_price_htg)}</td>
                      <td>{product.stock_quantity}</td>
                      <td>
                        {product.stock_quantity <= product.min_stock_quantity
                          ? "Stòk ba"
                          : "Nòmal"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !error && (
              <p className="workspace-empty mt-5 px-5 py-8 text-center text-sm">
                Ou poko ajoute okenn pwodwi. Sèvi ak fòm ki anlè a pou kòmanse.
              </p>
            )
          )}
        </div>
      </section>
    </WorkspaceShell>
  );
}

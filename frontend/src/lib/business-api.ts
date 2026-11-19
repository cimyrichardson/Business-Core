import { getSupabaseClient } from "./supabase";

export type PeriodKey = "7days" | "month" | "30days";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  purchase_cost_htg: number | null;
  unit_price_htg: number;
  stock_quantity: number;
  min_stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export interface Sale {
  id: string;
  product_id: string;
  product_name: string;
  sold_at: string;
  quantity: number;
  unit_price_htg: number;
  total_htg: number;
  payment_method: string | null;
}

export interface Expense {
  id: string;
  amount_htg: number;
  category: string;
  spent_at: string;
  description: string | null;
  created_at: string;
}

export interface TopProduct {
  product_id: string;
  name: string;
  quantity: number;
  revenue_htg: number;
}

export interface DailyActivity {
  date: string;
  revenue_htg: number;
  expenses_htg: number;
  sales_count: number;
}

export interface DashboardSummary {
  period: PeriodKey;
  start_date: string;
  end_date: string;
  revenue_htg: number;
  expenses_total_htg: number;
  sales_count: number;
  low_stock_count: number;
  daily_activity: DailyActivity[];
  top_products: TopProduct[];
  low_stock_products: Product[];
}

export type ChannelKey = "whatsapp" | "telegram";

export interface ChannelLink {
  channel: ChannelKey;
  connected: boolean;
  name: string | null;
  linked_at: string | null;
}

export interface ChannelLinkCode {
  channel: ChannelKey;
  code: string;
  expires_at: string;
}

export class BusinessApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "BusinessApiError";
  }
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown, label: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new BusinessApiError(`Done ${label} yo pa nan bon fòma.`);
  }
  return value as JsonRecord;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new BusinessApiError(`Done ${label} yo pa nan bon fòma.`);
  }
  return value;
}

function asNullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return asString(value, label);
}

function asInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new BusinessApiError(`Done ${label} yo pa nan bon fòma.`);
  }
  return value;
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new BusinessApiError(`Done ${label} yo pa nan bon fòma.`);
  }
  return value;
}

function parseProduct(value: unknown): Product {
  const product = asRecord(value, "pwodwi");
  return {
    id: asString(product.id, "id pwodwi"),
    name: asString(product.name, "non pwodwi"),
    description: asNullableString(product.description, "deskripsyon pwodwi"),
    purchase_cost_htg:
      product.purchase_cost_htg === null
        ? null
        : asInteger(product.purchase_cost_htg, "pri acha"),
    unit_price_htg: asInteger(product.unit_price_htg, "pri vant"),
    stock_quantity: asInteger(product.stock_quantity, "kantite stòk"),
    min_stock_quantity: asInteger(product.min_stock_quantity, "minimòm stòk"),
    is_active: asBoolean(product.is_active, "eta pwodwi"),
    created_at: asString(product.created_at, "dat kreyasyon pwodwi"),
  };
}

function parseSale(value: unknown): Sale {
  const sale = asRecord(value, "vant");
  return {
    id: asString(sale.id, "id vant"),
    product_id: asString(sale.product_id, "id pwodwi"),
    product_name: asString(sale.product_name, "non pwodwi"),
    sold_at: asString(sale.sold_at, "dat vant"),
    quantity: asInteger(sale.quantity, "kantite vann"),
    unit_price_htg: asInteger(sale.unit_price_htg, "pri inite"),
    total_htg: asInteger(sale.total_htg, "total vant"),
    payment_method: asNullableString(sale.payment_method, "mòd peman"),
  };
}

function parseExpense(value: unknown): Expense {
  const expense = asRecord(value, "depans");
  return {
    id: asString(expense.id, "id depans"),
    amount_htg: asInteger(expense.amount_htg, "montan depans"),
    category: asString(expense.category, "kategori depans"),
    spent_at: asString(expense.spent_at, "dat depans"),
    description: asNullableString(expense.description, "deskripsyon depans"),
    created_at: asString(expense.created_at, "dat kreyasyon depans"),
  };
}

function parseTopProduct(value: unknown): TopProduct {
  const product = asRecord(value, "pwodwi ki vann");
  return {
    product_id: asString(product.product_id, "id pwodwi"),
    name: asString(product.name, "non pwodwi"),
    quantity: asInteger(product.quantity, "kantite vann"),
    revenue_htg: asInteger(product.revenue_htg, "chif dafè"),
  };
}

function parseDailyActivity(value: unknown): DailyActivity {
  const activity = asRecord(value, "aktivite chak jou");
  return {
    date: asString(activity.date, "dat aktivite"),
    revenue_htg: asInteger(activity.revenue_htg, "chif dafè chak jou"),
    expenses_htg: asInteger(activity.expenses_htg, "depans chak jou"),
    sales_count: asInteger(activity.sales_count, "kantite vant chak jou"),
  };
}

function parseChannelLink(value: unknown): ChannelLink {
  const link = asRecord(value, "koneksyon chanèl");
  const channel = asString(link.channel, "chanèl");
  if (channel !== "whatsapp" && channel !== "telegram") {
    throw new BusinessApiError("Chanèl sa a pa valab.");
  }
  return {
    channel,
    connected: asBoolean(link.connected, "eta koneksyon"),
    name: asNullableString(link.name, "non kontak"),
    linked_at: asNullableString(link.linked_at, "dat koneksyon"),
  };
}

function parseChannelLinkCode(value: unknown): ChannelLinkCode {
  const result = asRecord(value, "kòd koneksyon");
  const channel = asString(result.channel, "chanèl");
  if (channel !== "whatsapp" && channel !== "telegram") {
    throw new BusinessApiError("Chanèl sa a pa valab.");
  }
  return {
    channel,
    code: asString(result.code, "kòd koneksyon"),
    expires_at: asString(result.expires_at, "dat ekspirasyon"),
  };
}

function parseList<T>(
  value: unknown,
  label: string,
  parseItem: (item: unknown) => T,
): T[] {
  if (!Array.isArray(value)) {
    throw new BusinessApiError(`Lis ${label} la pa nan bon fòma.`);
  }
  return value.map(parseItem);
}

function parseDashboardSummary(value: unknown): DashboardSummary {
  const summary = asRecord(value, "rezime biznis");
  const period = asString(summary.period, "peryòd");
  if (period !== "7days" && period !== "month" && period !== "30days") {
    throw new BusinessApiError("Peryòd rezime a pa valab.");
  }
  return {
    period,
    start_date: asString(summary.start_date, "dat kòmansman"),
    end_date: asString(summary.end_date, "dat fen"),
    revenue_htg: asInteger(summary.revenue_htg, "chif dafè"),
    expenses_total_htg: asInteger(
      summary.expenses_total_htg,
      "total depans",
    ),
    sales_count: asInteger(summary.sales_count, "kantite vant"),
    low_stock_count: asInteger(summary.low_stock_count, "kantite stòk ba"),
    daily_activity: parseList(
      summary.daily_activity,
      "aktivite chak jou",
      parseDailyActivity,
    ),
    top_products: parseList(
      summary.top_products,
      "pwodwi ki vann",
      parseTopProduct,
    ),
    low_stock_products: parseList(
      summary.low_stock_products,
      "pwodwi ki gen stòk ba",
      parseProduct,
    ),
  };
}

async function requestApi(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new BusinessApiError(
      "Adrès API biznis la manke. Ajoute NEXT_PUBLIC_API_URL nan frontend/.env.local.",
    );
  }

  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) {
    throw new BusinessApiError("Nou pa ka verifye sesyon an. Konekte ankò.");
  }
  if (!data.session) {
    throw new BusinessApiError("Sesyon an fini. Konekte pou kontinye.", 401);
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      credentials: "omit",
    });
  } catch (cause) {
    if (cause instanceof TypeError) {
      throw new BusinessApiError(
        "API biznis la pa reponn. Verifye si sèvè API a ap mache.",
      );
    }
    throw cause;
  }

  if (response.status === 204) return null;

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new BusinessApiError(
      "API biznis la voye yon repons nou pa ka li.",
      response.status,
    );
  }

  if (!response.ok) {
    const body = asRecord(payload, "erè API");
    const detail =
      typeof body.detail === "string" ? body.detail : "Demann lan pa t reyisi.";
    throw new BusinessApiError(detail, response.status);
  }

  return payload;
}

export async function getDashboardSummary(
  period: PeriodKey,
  signal?: AbortSignal,
): Promise<DashboardSummary> {
  const value = await requestApi(
    `/api/v1/dashboard/summary?period=${encodeURIComponent(period)}`,
    { signal },
  );
  return parseDashboardSummary(value);
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  const value = await requestApi("/api/v1/products", { signal });
  return parseList(value, "pwodwi", parseProduct);
}

export async function createProduct(
  product: Omit<Product, "id" | "is_active" | "created_at">,
): Promise<Product> {
  const value = await requestApi("/api/v1/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
  return parseProduct(value);
}

export async function getSales(
  period: PeriodKey,
  signal?: AbortSignal,
): Promise<Sale[]> {
  const value = await requestApi(
    `/api/v1/sales?period=${encodeURIComponent(period)}`,
    { signal },
  );
  return parseList(value, "vant", parseSale);
}

export async function createSale(input: {
  product_id: string;
  quantity: number;
  payment_method: string | null;
}): Promise<Sale> {
  const value = await requestApi("/api/v1/sales", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseSale(value);
}

export async function getExpenses(
  period: PeriodKey,
  signal?: AbortSignal,
): Promise<Expense[]> {
  const value = await requestApi(
    `/api/v1/expenses?period=${encodeURIComponent(period)}`,
    { signal },
  );
  return parseList(value, "depans", parseExpense);
}

export async function createExpense(input: {
  amount_htg: number;
  category: string;
  spent_at: string;
  description: string | null;
}): Promise<Expense> {
  const value = await requestApi("/api/v1/expenses", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseExpense(value);
}

export async function getChannelLinks(
  signal?: AbortSignal,
): Promise<ChannelLink[]> {
  const value = await requestApi("/api/v1/channels/links", { signal });
  return parseList(value, "koneksyon chanèl", parseChannelLink);
}

export async function createChannelLink(
  channel: ChannelKey,
): Promise<ChannelLinkCode> {
  const value = await requestApi("/api/v1/channels/links", {
    method: "POST",
    body: JSON.stringify({ channel }),
  });
  return parseChannelLinkCode(value);
}

export async function revokeChannelLink(channel: ChannelKey): Promise<void> {
  await requestApi(`/api/v1/channels/links/${channel}`, {
    method: "DELETE",
  });
}

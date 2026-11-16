import { AuthError, createClient, type User } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | undefined;

export function getSupabaseClient(): ReturnType<typeof createClient> {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase pa konfigire. Verifye NEXT_PUBLIC_SUPABASE_URL ak NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  supabaseClient = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
  return supabaseClient;
}

export function getUserDisplayName(user: User): string {
  const fullName = user.user_metadata.full_name;
  return typeof fullName === "string" && fullName.trim()
    ? fullName
    : user.email ?? "Itilizatè";
}

export function getAuthErrorMessage(
  error: unknown,
  action: "signup" | "login",
): string {
  if (error instanceof Error && error.message.startsWith("Supabase pa konfigire.")) {
    return error.message;
  }

  if (error instanceof AuthError) {
    if (error.status === 429) {
      return "Twòp tantativ. Tanpri tann yon ti moman anvan ou eseye ankò.";
    }
    if (error.code === "email_not_confirmed") {
      return "Tanpri konfime imèl ou anvan ou konekte.";
    }
    if (error.code === "invalid_credentials") {
      return "Imèl la oswa modpas la pa kòrèk.";
    }
    if (error.code === "user_already_exists") {
      return "Gen yon kont ki deja itilize imèl sa a. Eseye konekte pito.";
    }
    if (error.code === "weak_password") {
      return "Chwazi yon modpas ki pi solid, avèk omwen 8 karaktè.";
    }
  }

  return action === "signup"
    ? "Enskripsyon an pa t reyisi. Verifye enfòmasyon yo epi eseye ankò."
    : "Koneksyon an pa t reyisi. Verifye imèl la ak modpas la.";
}

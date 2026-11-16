"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getAuthErrorMessage,
  getSupabaseClient,
  getUserDisplayName,
} from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function AuthControls() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    void Promise.resolve()
      .then(() => {
        const supabase = getSupabaseClient();
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (active) {
            setUser(session?.user ?? null);
            setLoading(false);
          }
        });
        unsubscribe = () => data.subscription.unsubscribe();
        return supabase.auth.getSession();
      })
      .then(({ data: sessionData, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          setError(getAuthErrorMessage(sessionError, "login"));
        }
        setUser(sessionData.session?.user ?? null);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(getAuthErrorMessage(cause, "login"));
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setError("");
    try {
      const { error: signOutError } = await getSupabaseClient().auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
    } catch (cause) {
      setError(getAuthErrorMessage(cause, "login"));
    }
  }

  if (loading) {
    return <span className="h-10 w-32 animate-pulse rounded-lg bg-blue-50" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-semibold sm:inline">
          Bonjou, {getUserDisplayName(user)}
        </span>
        <Link
          href="/dashboard"
          className="rounded-lg bg-[#123BFF] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          Tablo bò
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-[#123BFF] px-4 py-2.5 text-sm font-semibold text-[#123BFF] transition hover:bg-blue-50"
        >
          Dekonekte
        </button>
        {error && (
          <span className="text-sm text-red-700" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/connexion"
        className="rounded-lg border border-[#123BFF] px-4 py-2.5 text-sm font-semibold text-[#123BFF] transition hover:bg-blue-50"
      >
        Konekte
      </Link>
      <Link
        href="/inscription"
        className="rounded-lg bg-[#123BFF] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
      >
        Kreye kont
      </Link>
      {error && (
        <span className="text-sm text-red-700" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

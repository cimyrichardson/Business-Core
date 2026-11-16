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
    return <span className="h-10 w-32 animate-pulse rounded-lg bg-[#e6ede2]" />;
  }

  if (user) {
    return (
      <div className="auth-controls">
        <span className="hidden text-sm font-semibold sm:inline">
          Bonjou, {getUserDisplayName(user)}
        </span>
        <Link
          href="/dashboard"
          className="auth-control-link auth-control-primary"
        >
          Tablo bò
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="auth-control-button"
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
    <div className="auth-controls">
      <Link
        href="/connexion"
        className="auth-control-link"
      >
        Konekte
      </Link>
      <Link
        href="/inscription"
        className="auth-control-link auth-control-primary"
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

"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabase";

export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    void getSupabaseClient()
      .auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) throw error;
        if (!data.session) {
          setErrorMessage(
            "Lyen an pa valab oswa li ekspire. Mande yon lòt imèl pou chanje modpas la.",
          );
          return;
        }
        setIsReady(true);
      })
      .catch(() => {
        if (active) {
          setErrorMessage(
            "Nou pa ka verifye lyen an. Mande yon nouvo imèl pou chanje modpas la.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmation) {
      setErrorMessage("Modpas yo pa menm. Tanpri verifye yo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password });
      if (error) throw error;
      router.replace("/dashboard");
    } catch {
      setErrorMessage(
        "Nou pa ka chanje modpas la kounye a. Verifye lyen an epi eseye ankò.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <nav className="auth-nav" aria-label="Navigasyon prensipal">
          <Link href="/" className="landing-brand">
            <span className="landing-brand-mark" aria-hidden="true">
              bc
            </span>
            <span>Business Core</span>
          </Link>
        </nav>
      </header>

      <section className="auth-content">
        <div className="auth-heading">
          <p className="landing-kicker landing-kicker-dark">Sekirite kont</p>
          <h1>Chwazi yon nouvo modpas.</h1>
          <p>Modpas la dwe gen omwen 8 karaktè.</p>
        </div>

        <div className="auth-panel">
          {isReady ? (
            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="new-password">Nouvo modpas</label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="confirm-password">Konfime nouvo modpas la</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>
              {errorMessage && (
                <p role="alert" className="auth-form-error">
                  {errorMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-submit"
              >
                {isSubmitting ? "Ap chanje modpas la..." : "Sove nouvo modpas la"}
              </button>
            </form>
          ) : (
            <p className={errorMessage ? "auth-form-error" : "auth-footer-copy"} role={errorMessage ? "alert" : "status"}>
              {errorMessage || "Ap verifye lyen an..."}
            </p>
          )}
          {errorMessage && !isReady && (
            <Link href="/mot-de-passe-oublie" className="auth-link">
              Mande yon lòt lyen
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

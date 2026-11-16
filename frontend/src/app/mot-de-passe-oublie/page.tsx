"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import { getAuthErrorMessage, getSupabaseClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
        },
      );
      if (error) throw error;
      setSuccessMessage(
        "Si yon kont itilize adrès sa a, w ap resevwa yon imèl ak enstriksyon pou chanje modpas la.",
      );
    } catch (cause) {
      setErrorMessage(getAuthErrorMessage(cause, "login"));
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
          <Link href="/connexion" className="auth-nav-action">
            Retounen konekte
          </Link>
        </nav>
      </header>

      <section className="auth-content">
        <div className="auth-heading">
          <p className="landing-kicker landing-kicker-dark">Aksè sou kont ou</p>
          <h1>Chanje modpas ou.</h1>
          <p>Antre imèl kont ou; n ap voye etap pou kreye yon nouvo modpas.</p>
        </div>

        <div className="auth-panel">
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="reset-email">Imèl kont lan</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="non@biznis.com"
                autoComplete="email"
                required
              />
            </div>

            {errorMessage && (
              <p role="alert" className="auth-form-error">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p role="status" className="auth-form-success">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit"
            >
              {isSubmitting ? "Ap voye imèl la..." : "Voye enstriksyon yo"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

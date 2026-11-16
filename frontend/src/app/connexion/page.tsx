"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAuthErrorMessage, getSupabaseClient } from "@/lib/supabase";

export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur("");
    setIsSubmitting(true);

    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      router.replace("/dashboard");
    } catch (cause) {
      setErreur(getAuthErrorMessage(cause, "login"));
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
          <Link href="/inscription" className="auth-nav-action">
            Kreye kont
          </Link>
        </nav>
      </header>

      <section className="auth-content">
        <div className="auth-heading">
          <p className="landing-kicker landing-kicker-dark">Espas biznis mwen</p>
          <h1>Kontinye kote w te kanpe.</h1>
          <p>Konekte pou w retounen sou enfòmasyon biznis ou yo.</p>
        </div>

        <div className="auth-panel">
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Imèl</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="non@biznis.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Modpas</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Antre modpas ou"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="text-right">
              <Link href="/mot-de-passe-oublie" className="auth-link">
                Ou bliye modpas ou?
              </Link>
            </div>

            {erreur && (
              <p role="alert" className="auth-form-error">
                {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit"
            >
              {isSubmitting ? "Ap konekte..." : "Konekte"}
            </button>
          </form>

          <div className="auth-divider">
            <p className="auth-footer-copy">Ou poko gen kont?</p>
            <Link href="/inscription" className="auth-link">
              Kreye yon kont Business Core
            </Link>
          </div>
        </div>

        <p className="auth-legal-note">
          Lè w itilize Business Core, ou dakò ak{" "}
          <Link href="/conditions-utilisation" className="auth-link">
            kondisyon itilizasyon yo
          </Link>{" "}
          ak{" "}
          <Link href="/politique-confidentialite" className="auth-link">
            politik konfidansyalite a
          </Link>
          .
        </p>
      </section>
    </main>
  );
}

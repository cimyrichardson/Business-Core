"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAuthErrorMessage, getSupabaseClient } from "@/lib/supabase";

export default function Inscription() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    if (password !== confirmation) {
      setErreur("Modpas yo pa menm. Tanpri verifye yo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await getSupabaseClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: nom.trim(),
            business_name: business.trim(),
          },
          emailRedirectTo: `${window.location.origin}/connexion`,
        },
      });

      if (error) throw error;
      if (data.session) {
        router.replace("/dashboard");
        return;
      }

      setMessage(
        "Kont lan kreye. Tcheke imèl ou pou konfime adrès la anvan ou konekte.",
      );
      setPassword("");
      setConfirmation("");
    } catch (cause) {
      setErreur(getAuthErrorMessage(cause, "signup"));
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
          <Link href="/" className="auth-nav-action">
            Akèy
          </Link>
        </nav>
      </header>

      <section className="auth-content">
        <div className="auth-heading">
          <p className="landing-kicker landing-kicker-dark">Kòmanse isit la</p>
          <h1>Kreye espas biznis ou.</h1>
          <p>Antre enfòmasyon w yo pou kòmanse mete aktivite w annòd.</p>
        </div>

        <div className="auth-panel">
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="signup-name">Non konplè</label>
              <input
                id="signup-name"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Antre non konplè ou"
                required
                autoComplete="name"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Imèl</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="non@biznis.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-business">Non biznis la</label>
              <input
                id="signup-business"
                type="text"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="Antre non biznis ou"
                required
                autoComplete="organization"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Modpas</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Chwazi yon modpas"
                minLength={8}
                required
                autoComplete="new-password"
              />
              <p className="auth-hint">Omwen 8 karaktè.</p>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm">Konfime modpas</label>
              <input
                id="signup-confirm"
                type="password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="Antre modpas la ankò"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>

            {erreur && (
              <p role="alert" className="auth-form-error">
                {erreur}
              </p>
            )}
            {message && (
              <p role="status" className="auth-form-success">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit"
            >
              {isSubmitting ? "Ap kreye kont la..." : "Kreye kont mwen"}
            </button>
          </form>

          <div className="auth-divider">
            <p className="auth-footer-copy">
              Ou deja gen yon kont?{" "}
              <Link href="/connexion" className="auth-link">
                Konekte
              </Link>
            </p>
          </div>
        </div>

        <p className="auth-legal-note">
          Lè w kreye kont lan, ou dakò ak{" "}
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


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
    <main className="min-h-screen bg-[#F5F7FF] text-[#172554]">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">

          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123BFF] text-lg font-bold text-white">
              BC
            </span>

            <span className="text-xl font-bold">
              Business Core
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-[#123BFF] px-5 py-3 text-sm font-semibold text-[#123BFF] transition hover:bg-blue-50"
          >
            Akèy
          </Link>

        </nav>
      </header>

      {/* FORMULAIRE */}
      <section className="px-5 py-12 sm:py-16">

        <div className="mx-auto max-w-md">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Kreye kont ou
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Kòmanse òganize aktivite biznis ou avèk Business Core.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-lg shadow-blue-900/5 sm:p-9">

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Non konplè
                </label>

                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Antre non konplè ou"
                  required
                  autoComplete="name"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#123BFF] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Imèl
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="egzanp@email.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#123BFF] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Non biznis la
                </label>

                <input
                  type="text"
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  placeholder="Antre non biznis ou"
                  required
                  autoComplete="organization"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#123BFF] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Modpas
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kreye yon modpas"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#123BFF] focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Modpas la dwe gen omwen 8 karaktè.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Konfime modpas
                </label>

                <input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Antre modpas la ankò"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#123BFF] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {erreur && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {erreur}
                </p>
              )}
              {message && (
                <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#123BFF] py-3.5 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Ap kreye kont la..." : "Kreye kont mwen"}
              </button>

            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              Ou deja gen yon kont?{" "}
              <Link
                href="/connexion"
                className="font-bold text-[#123BFF] hover:underline"
              >
                Konekte
              </Link>
            </p>

          </div>

          <p className="mt-7 text-center text-xs text-gray-400">
            © 2026 Business Core. Tout dwa rezève.
          </p>

        </div>

      </section>
    </main>
  );
}
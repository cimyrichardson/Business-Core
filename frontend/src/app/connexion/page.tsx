
"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur("");

    setErreur(
      "Koneksyon an poko disponib. Sistèm nan bezwen konekte ak backend la."
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FF] text-[#172554]">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">

          <a href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123BFF] text-lg font-bold text-white">
              BC
            </span>

            <span className="text-xl font-bold">
              Business Core
            </span>
          </a>

          <a
            href="/inscription"
            className="rounded-lg border border-[#123BFF] px-5 py-3 text-sm font-semibold text-[#123BFF] transition hover:bg-blue-50"
          >
            Kreye kont
          </a>

        </nav>
      </header>

      {/* FORMULAIRE DE CONNEXION */}
      <section className="px-5 py-14 sm:py-20">

        <div className="mx-auto max-w-md">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Byenveni ankò!
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Konekte sou kont ou pou kontinye jere biznis ou.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-lg shadow-blue-900/5 sm:p-9">

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Imèl
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Antre imèl ou"
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#123BFF] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* MODPAS */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Modpas
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Antre modpas ou"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#123BFF] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="text-right">
                <a
                  href="/mot-de-passe-oublie"
                  className="text-sm font-semibold text-[#123BFF] hover:underline"
                >
                  Ou bliye modpas ou?
                </a>
              </div>

              {/* MESAJ */}
              {erreur && (
                <p className="rounded-lg bg-blue-50 p-3 text-sm text-[#123BFF]">
                  {erreur}
                </p>
              )}

              {/* BOUTON */}
              <button
                type="submit"
                className="w-full rounded-lg bg-[#123BFF] py-3.5 font-bold text-white transition hover:bg-blue-800"
              >
                Konekte
              </button>

            </form>

            <div className="mt-7 border-t border-gray-100 pt-6 text-center">
              <p className="text-sm text-gray-500">
                Ou poko gen kont?
              </p>

              <a
                href="/inscription"
                className="mt-2 inline-block font-bold text-[#123BFF] hover:underline"
              >
                Kreye yon kont Business Core
              </a>
            </div>

          </div>

          <p className="mt-7 text-center text-xs text-gray-400">
            © 2026 Business Core. Tout dwa rezève.
          </p>

        </div>

      </section>
    </main>
  );
}
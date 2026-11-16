"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getAuthErrorMessage, getSupabaseClient, getUserDisplayName } from "@/lib/supabase";

const navigation = [
  { href: "/dashboard", label: "Tablo bò", icon: "T" },
  { href: "/pwodwi", label: "Pwodwi ak stòk", icon: "P" },
  { href: "/vant", label: "Vant", icon: "V" },
  { href: "/depans", label: "Depans", icon: "D" },
  { href: "/asistan", label: "Asistan", icon: "A" },
  { href: "/kanal", label: "Mesaj ak rapò", icon: "M" },
];

const WorkspaceUserContext = createContext<User | null>(null);

export function useWorkspaceUser(): User {
  const user = useContext(WorkspaceUserContext);
  if (!user) {
    throw new Error("useWorkspaceUser must be used inside WorkspaceShell.");
  }
  return user;
}

export default function WorkspaceShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    void Promise.resolve()
      .then(() => {
        if (!active) return null;

        const supabase = getSupabaseClient();
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          if (!session) {
            setUser(null);
            router.replace("/connexion");
            return;
          }
          setUser(session.user);
          setIsLoading(false);
        });
        unsubscribe = () => data.subscription.unsubscribe();
        return supabase.auth.getSession();
      })
      .then((result) => {
        if (!active || !result) return;
        if (result.error) throw result.error;
        if (!result.data.session) {
          router.replace("/connexion");
          return;
        }
        setUser(result.data.session.user);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(getAuthErrorMessage(cause, "login"));
        setIsLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        setIsDark(window.localStorage.getItem("business-core-theme") === "dark");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    try {
      window.localStorage.setItem(
        "business-core-theme",
        nextIsDark ? "dark" : "light",
      );
    } catch {
      setError("Nou pa ka sove chwa koulè a sou aparèy sa a.");
    }
  }

  async function signOut() {
    setError("");
    try {
      const { error: signOutError } = await getSupabaseClient().auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/connexion");
    } catch (cause) {
      setError(getAuthErrorMessage(cause, "login"));
    }
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FF] px-5 text-[#172554]">
        <div className="text-center">
          {error ? (
            <p role="alert" className="max-w-md text-sm text-red-700">
              {error}
            </p>
          ) : (
            <p role="status">Ap verifye sesyon an...</p>
          )}
        </div>
      </main>
    );
  }

  const businessName = user.user_metadata.business_name;
  const currentPage = navigation.find((item) => item.href === pathname);

  return (
    <WorkspaceUserContext.Provider value={user}>
      <div className={`workspace-shell${isDark ? " workspace-theme-dark" : ""}`}>
        <aside className="workspace-sidebar">
          <Link href="/" className="workspace-brand">
            <span className="workspace-brand-mark">BC</span>
            <span>Business Core</span>
          </Link>

          <p className="workspace-sidebar-label">MENI BIZNIS LA</p>
          <nav aria-label="Navigasyon dashboard" className="workspace-nav">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`workspace-nav-link${isActive ? " workspace-nav-link-active" : ""}`}
                >
                  <span className="workspace-nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="workspace-sidebar-bottom">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Aktive mòd klè" : "Aktive mòd nwa"}
              aria-pressed={isDark}
              className="workspace-nav-link workspace-theme-button"
            >
              <span className="workspace-nav-icon" aria-hidden="true">
                {isDark ? "☼" : "◐"}
              </span>
              {isDark ? "Klè" : "Nwa"}
            </button>
            <Link href="/" className="workspace-nav-link">
              <span className="workspace-nav-icon" aria-hidden="true">
                ↩
              </span>
              Retounen sou sit la
            </Link>
          </div>
        </aside>

        <div className="workspace-main">
          <header className="workspace-header">
            <div className="min-w-0">
              <p className="workspace-header-eyebrow">BUSINESS CORE</p>
              <h1 className="workspace-header-title">
                {currentPage?.label ?? "Business Core"}
              </h1>
            </div>
            <div className="workspace-user">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-semibold">
                  {getUserDisplayName(user)}
                </p>
                <p className="workspace-muted truncate text-xs">
                  {typeof businessName === "string" && businessName.trim()
                    ? businessName
                    : user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="workspace-signout"
              >
                Dekonekte
              </button>
            </div>
          </header>

          {error && (
            <p role="alert" className="workspace-alert">
              {error}
            </p>
          )}
          <div className="workspace-content">{children}</div>
        </div>
      </div>
    </WorkspaceUserContext.Provider>
  );
}

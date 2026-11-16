import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <header className="auth-header">
        <nav className="auth-nav" aria-label="Navigasyon prensipal">
          <Link href="/" className="landing-brand">
            <span className="landing-brand-mark" aria-hidden="true">
              bc
            </span>
            <span>Business Core</span>
          </Link>
          <Link href="/connexion" className="auth-nav-action">
            Konekte
          </Link>
        </nav>
      </header>

      <section className="not-found-main">
        <span className="not-found-code">ERÈ 404 · PAJ LA PA LA</span>
        <h1>Nou pa jwenn paj sa a.</h1>
        <p>
          Adrès la ka chanje oswa paj la ka pa egziste ankò. Retounen sou sit
          la pou kontinye.
        </p>
        <div className="landing-hero-actions">
          <Link href="/" className="landing-button landing-button-dark">
            Retounen akèy
          </Link>
          <Link href="/inscription" className="auth-link">
            Kreye yon kont
          </Link>
        </div>
      </section>

      <footer className="landing-footer-bottom">
        <span>Business Core</span>
        <Link href="/mentions-legales">Nòt legal</Link>
      </footer>
    </main>
  );
}

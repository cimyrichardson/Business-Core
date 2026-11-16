import Link from "next/link";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="legal-page">
      <header className="auth-header">
        <nav className="auth-nav" aria-label="Navigasyon prensipal">
          <Link href="/" className="landing-brand">
            <span className="landing-brand-mark" aria-hidden="true">
              bc
            </span>
            <span>Business Core</span>
          </Link>
          <Link href="/" className="auth-nav-action">
            Retounen sou sit la
          </Link>
        </nav>
      </header>

      <article className="legal-main">
        <p className="landing-kicker landing-kicker-dark">
          Enfòmasyon ak règleman
        </p>
        <h1>{title}</h1>
        <p className="legal-intro">{intro}</p>
        <p className="auth-hint">Dènye mizajou: 16 novanm 2026</p>

        <aside className="legal-draft-notice">
          Paj sa a se yon pwojè enfòmasyon. Anvan piblikasyon ofisyèl, Business
          Core dwe verifye detay legal, kontak, hosting ak kondisyon ki aplike
          nan peyi kote sèvis la opere.
        </aside>

        <div className="legal-sections">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="legal-intro">
          Kesyon sou paj sa yo? Ekri nou nan{" "}
          <a className="auth-link" href="mailto:businesscore@gmail.com">
            businesscore@gmail.com
          </a>
          .
        </p>
      </article>
    </main>
  );
}

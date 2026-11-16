import type { Metadata } from "next";
import Link from "next/link";

import AuthControls from "./AuthControls";

export const metadata: Metadata = {
  title: "Business Core — Biznis ou, pi byen òganize",
  description:
    "Òganize lavant, depans ak stòk biznis ou an kreyòl, nan yon sèl espas.",
};

const features = [
  {
    title: "Lavant ak depans",
    description:
      "Ekri chak lavant ak depans pou w ka wè sa k ap antre ak sa k ap soti.",
    mark: "V",
  },
  {
    title: "Stòk ki klè",
    description:
      "Swiv pwodwi ki rete yo epi remake alè lè yon atik ap fini.",
    mark: "S",
  },
  {
    title: "Rapò nan lang ou",
    description:
      "Jwenn rezime biznis ou epi poze kesyon an kreyòl ayisyen.",
    mark: "K",
  },
];

const questions = [
  {
    question: "Pou ki kalite biznis Business Core fèt?",
    answer:
      "Li fèt pou ti ak mwayen biznis ki bezwen òganize lavant, depans ak pwodwi yo.",
  },
  {
    question: "Èske m bezwen konnen kontablite pou m itilize l?",
    answer:
      "Non. Ou ka kòmanse ak enfòmasyon senp tankou lavant, depans ak kantite pwodwi ki rete.",
  },
  {
    question: "Èske m ka poze kesyon an kreyòl?",
    answer:
      "Wi. Business Core ap fèt pou rann enfòmasyon biznis ou pi fasil pou konprann an kreyòl.",
  },
];

export default function Home() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <nav className="landing-nav" aria-label="Navigasyon prensipal">
          <Link href="/" className="landing-brand" aria-label="Business Core, Akèy">
            <span className="landing-brand-mark" aria-hidden="true">
              bc
            </span>
            <span>Business Core</span>
          </Link>

          <div className="landing-nav-links">
            <a href="#fonksyonalite">Sa l fè</a>
            <a href="#mesajri">Kijan pou itilize l</a>
          </div>

          <AuthControls />
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-grid" aria-hidden="true" />
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="landing-kicker">
              Yon zouti pou biznis ki toujou ap vanse
            </p>
            <h1>
              Kenbe biznis ou
              <br />
              <span>nan men ou.</span>
            </h1>
            <p className="landing-hero-description">
              Lavant, depans ak stòk — òganize yo yon fason ki senp, nan lang
              ou. Pou w konnen kote biznis ou kanpe, san w pa fouye nan kaye yo.
            </p>
            <div className="landing-hero-actions">
              <Link href="/inscription" className="landing-button landing-button-lime">
                Kòmanse gratis
              </Link>
              <a href="#fonksyonalite" className="landing-text-link">
                Dekouvri kijan li mache <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="landing-hero-note">
              Kontwòl senp pou aktivite ki fè biznis ou grandi.
            </p>
          </div>

          <div className="ledger-preview" aria-label="Egzanp tablo biznis">
            <div className="ledger-topline">
              <div>
                <p className="ledger-overline">Egzanp tablo biznis</p>
                <h2>Ti Mache Lakay</h2>
              </div>
              <span className="ledger-status">
                <span aria-hidden="true" /> Jodi a
              </span>
            </div>

            <div className="ledger-total">
              <p>Vant jounen an</p>
              <strong>18,450 <small>HTG</small></strong>
              <span>Egzanp enfòmasyon pou montre kijan tablo a ka parèt.</span>
            </div>

            <div className="ledger-list">
              <div className="ledger-list-heading">
                <span>Dènye aktivite</span>
                <span>Montan</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-mark ledger-mark-sale">V</span>
                <span className="ledger-row-copy">
                  <strong>Vant nan boutik</strong>
                  <small>Jodi a, 10:42</small>
                </span>
                <strong>+ 2,500</strong>
              </div>
              <div className="ledger-row">
                <span className="ledger-mark ledger-mark-stock">S</span>
                <span className="ledger-row-copy">
                  <strong>Rès diri 1 kg</strong>
                  <small>5 inite ki rete</small>
                </span>
                <span className="ledger-low">Stòk ba</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-mark ledger-mark-cost">D</span>
                <span className="ledger-row-copy">
                  <strong>Acha founiti</strong>
                  <small>Jodi a, 09:15</small>
                </span>
                <strong className="ledger-negative">− 1,200</strong>
              </div>
            </div>
            <p className="ledger-footnote">
              Egzanp vizyèl · pa done yon kont reyèl
            </p>
          </div>
        </div>
        <div className="landing-hero-edge" aria-hidden="true">
          biznis · lavant · stòk · depans · biznis · lavant · stòk · depans ·
        </div>
      </section>

      <section className="landing-intro" id="fonksyonalite">
        <div className="landing-section-heading">
          <p className="landing-kicker landing-kicker-dark">
            Plis klète, mwens devinèt
          </p>
          <h2>
            Sa w bezwen konnen,
            <br />
            <span>san konplikasyon.</span>
          </h2>
          <p>
            Lè enfòmasyon yo byen ranje, li pi fasil pou pran pwochen desizyon
            an.
          </p>
        </div>

        <div className="feature-ledger">
          {features.map((feature) => (
            <article className="feature-row" key={feature.title}>
              <span className="feature-mark">{feature.mark}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="message-section" id="mesajri">
        <div className="message-copy">
          <p className="landing-kicker landing-kicker-dark">
            Kote w deja ye
          </p>
          <h2>
            Biznis ou pa
            <br />
            rete nan biwo a.
          </h2>
          <p>
            Business Core ap devlope pou ede w jwenn rapò ak pale ak asistan
            biznis ou sou entènèt, WhatsApp oswa Telegram.
          </p>
          <Link href="/inscription" className="landing-button landing-button-dark">
            Kreye kont mwen
          </Link>
        </div>
        <div className="message-note">
          <div className="message-note-head">
            <span className="message-note-dot" aria-hidden="true" />
            Yon ti egzanp konvèsasyon
          </div>
          <p className="message-bubble message-bubble-assistant">
            Bonjou! Kijan m ka ede w konprann biznis ou jodi a?
          </p>
          <p className="message-bubble message-bubble-user">
            Ki pwodwi ki prèske fini?
          </p>
          <p className="message-bubble message-bubble-assistant">
            Lè done stòk yo konekte, m ap ede w jwenn repons sa a.
          </p>
          <span className="message-note-caption">
            Egzanp koòdone · fonksyon sa a poko disponib
          </span>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-heading">
          <p className="landing-kicker landing-kicker-dark">Bon pou konnen</p>
          <h2>Kesyon ou ka genyen.</h2>
        </div>
        <div className="faq-list">
          {questions.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <p className="landing-kicker">Premye pa a senp</p>
          <h2>Bay biznis ou yon bon kòmansman.</h2>
        </div>
        <Link href="/inscription" className="landing-button landing-button-lime">
          Kòmanse gratis <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-main">
          <div className="landing-footer-about">
            <Link href="/" className="landing-brand landing-brand-footer">
              <span className="landing-brand-mark" aria-hidden="true">
                bc
              </span>
              <span>Business Core</span>
            </Link>
            <p>
              Zouti pou mete lòd nan aktivite biznis yo, ak enfòmasyon ki pale
              ak ou.
            </p>
          </div>
          <div className="landing-footer-links">
            <h2>Enfòmasyon</h2>
            <Link href="/mentions-legales">Nòt legal</Link>
            <Link href="/conditions-utilisation">Kondisyon itilizasyon</Link>
            <Link href="/politique-confidentialite">Konfidansyalite</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
          <div className="landing-footer-contact">
            <h2>Kesyon?</h2>
            <a href="mailto:businesscore@gmail.com">
              businesscore@gmail.com
            </a>
            <Link href="/connexion">Konekte sou kont mwen</Link>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 Business Core</span>
          <span>Fèt pou ede biznis ou avanse.</span>
        </div>
      </footer>
    </main>
  );
}


import Image from "next/image";

const features = [
  {
    number: "01",
    title: "Vant, depans ak stòk",
    description:
      "Jere enfòmasyon sou lavant, depans ak pwodwi ou yo nan yon sèl platfòm.",
  },
  {
    number: "02",
    title: "Rapò ak alèt otomatik",
    description:
      "Resevwa rezime aktivite biznis ou ak avètisman lè yon pwodwi prèske fini.",
  },
  {
    number: "03",
    title: "Asistan entèlijan",
    description:
      "Poze kesyon an kreyòl epi jwenn repons ki baze sou enfòmasyon biznis ou.",
  },
];

const questions = [
  {
    question: "Kisa Business Core ye?",
    answer:
      "Business Core se yon platfòm dijital ki ede w òganize lavant, depans, pwodwi ak lòt aktivite biznis ou.",
  },
  {
    question: "Kijan mwen ka itilize Business Core?",
    answer:
      "Ou ka itilize platfòm entènèt la pou jere enfòmasyon biznis ou epi kominike ak asistan an sou WhatsApp oswa Telegram.",
  },
  {
    question: "Èske Business Core disponib an kreyòl?",
    answer:
      "Wi. Business Core fèt pou pèmèt ou kominike ak asistan an an kreyòl ayisyen.",
  },
  {
    question: "Èske mwen ka itilize WhatsApp ak Telegram?",
    answer:
      "Wi. Ou ka jwenn enfòmasyon, resevwa rapò ak alèt atravè WhatsApp ak Telegram.",
  },
  {
    question: "Kijan mwen ka vin yon itilizatè Business Core?",
    answer:
      "Klike sou bouton Rejwenn Business Core pou ale nan paj enskripsyon an epi kòmanse kreye kont ou.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#172554]">

      {/* NAVIGATION */}
      <header className="bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123BFF] text-lg font-bold text-white">
              BC
            </span>
            <span className="text-xl font-bold">Business Core</span>
          </a>

          <a
            href="/inscription"
            className="rounded-lg bg-[#123BFF] px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800"
          >
            Rejwenn Business Core
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#123BFF] text-white">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-white/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 md:grid-cols-2 md:py-28 lg:px-10">
          <div>
            <p className="mb-6 inline-block rounded-full border border-white/30 px-4 py-2 text-sm text-blue-100">
              Yon nouvo fason pou jere biznis ou
            </p>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Jesyon biznis ou, pi senp. Enfòmasyon yo, pi pre ou.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-blue-100">
              Business Core ede w suiv lavant, depans ak stòk ou an goud.
              Resevwa rezime ak alèt an kreyòl, dirèkteman sou WhatsApp
              oswa Telegram.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/inscription"
                className="rounded-lg bg-white px-7 py-4 font-bold text-[#123BFF] transition hover:bg-blue-50"
              >
                Rejwenn Business Core
              </a>

              <a
                href="#fonksyonalite"
                className="rounded-lg border border-white/50 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                Dekouvri platfòm nan
              </a>
            </div>

            <p className="mt-7 text-sm text-blue-100">
              Tout enfòmasyon biznis ou nan yon sèl espas.
            </p>
          </div>

          {/* DEMONSTRATION ASISTAN */}
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-2xl bg-white p-5 shadow-2xl shadow-blue-950/20 sm:p-7">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#123BFF] font-bold text-white">
                  BC
                </div>

                <div>
                  <p className="font-bold text-[#172554]">Business Core</p>
                  <p className="text-xs text-gray-500">Asistan biznis ou</p>
                </div>

                <span className="ml-auto rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Asistan
                </span>
              </div>

              <div className="space-y-4 py-6">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#F1F4FF] p-4 text-sm leading-6 text-[#172554]">
                  Bonjou! Men rezime aktivite biznis ou pou jounen an.
                </div>

                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#123BFF] p-4 text-sm leading-6 text-white">
                  Ki pwodwi ki vann pi plis semèn sa a?
                </div>

                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#F1F4FF] p-4 text-sm leading-6 text-[#172554]">
                  Pwodwi ki vann pi plis yo se Diri 1 kg, Lwil 1 L ak Sik 1 kg.
                  <p className="mt-2 text-xs text-gray-500">
                    Peryòd : semèn sa a
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-[#F6F7FB] px-4 py-3 text-sm text-gray-400">
                Poze yon kesyon...
              </div>

              <p className="mt-3 text-center text-xs text-gray-400">
                Egzanp konvèsasyon Business Core
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FONKSYONALITE */}
      <section
        id="fonksyonalite"
        className="bg-[#F3F5FF] px-6 py-20 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-widest text-[#123BFF]">
              Sa Business Core fè pou ou
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Tout sa ou bezwen pou pi byen suiv aktivite biznis ou.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="rounded-xl border border-blue-100 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-[#123BFF]">
                  {feature.number}
                </span>

                <h3 className="mt-6 text-xl font-bold">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>

          {/* ...*/}
          <div className="mt-14 border-l-4 border-[#123BFF] bg-white px-7 py-8 md:px-10">
            <h2 className="max-w-3xl text-2xl font-bold leading-snug sm:text-3xl">
              Plis òganizasyon pou biznis ou. Plis kontwòl sou aktivite ou.
            </h2>
          </div>
        </div>
      </section>

      {/* WHATSAPP ET TELEGRAM */}
      <section
        id="platfom-mesajri"
        className="px-6 py-20 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#123BFF]">
              Toujou konekte ak biznis ou
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Itilize Business Core sou WhatsApp ak Telegram.
            </h2>

            <p className="mt-5 leading-8 text-gray-600">
              Resevwa rapò, jwenn alèt epi poze kesyon sou biznis ou
              dirèkteman sou platfòm mesajri ou itilize chak jou.
            </p>
          </div>

          <div className="mt-14 grid items-start gap-10 md:grid-cols-2">

            {/* WHATSAPP */}
            <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg shadow-blue-900/5">
              <div className="flex items-center gap-3 bg-[#075E54] px-5 py-4 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl font-bold">
                  W
                </div>

                <div>
                  <h3 className="font-bold">WhatsApp</h3>
                  <p className="text-xs text-green-100">
                    Business Core
                  </p>
                </div>
              </div>

              <div className="bg-[#F5F1E9] p-4 sm:p-6">
                <div className="mx-auto max-w-sm overflow-hidden rounded-xl bg-white shadow-sm">
                  <Image
                    src="/images/WhatsApp.png"
                    alt="Maquette de Business Core sur WhatsApp"
                    width={780}
                    height={1688}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-xl font-bold">
                  Business Core sou WhatsApp
                </h4>

                <p className="mt-2 leading-7 text-gray-600">
                  Jwenn enfòmasyon sou biznis ou dirèkteman nan
                  konvèsasyon WhatsApp ou.
                </p>
              </div>
            </article>

            {/* TELEGRAM */}
            <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg shadow-blue-900/5">
              <div className="flex items-center gap-3 bg-[#229ED9] px-5 py-4 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl font-bold">
                  T
                </div>

                <div>
                  <h3 className="font-bold">Telegram</h3>
                  <p className="text-xs text-blue-50">
                    Business Core
                  </p>
                </div>
              </div>

              <div className="bg-[#EEF5FA] p-4 sm:p-6">
                <div className="mx-auto max-w-sm overflow-hidden rounded-xl bg-white shadow-sm">
                  <Image
                    src="/images/Telegram.png"
                    alt="Maquette de Business Core sur Telegram"
                    width={780}
                    height={1688}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-xl font-bold">
                  Business Core sou Telegram
                </h4>

                <p className="mt-2 leading-7 text-gray-600">
                  Ou ka itilize Telegram tou pou resevwa rapò ak
                  kominike avèk asistan Business Core la.
                </p>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* INVITATION appel a l'action */}
      <section className="px-6 pb-20 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-3xl bg-[#123BFF] px-7 py-14 text-center text-white sm:px-14 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-100">
            Business Core
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold sm:text-4xl">
            Pare pou w pran plis kontwòl sou biznis ou?
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-blue-100">
            Dekouvri yon fason pi senp pou òganize aktivite ou
            epi jwenn enfòmasyon ou bezwen yo.
          </p>

          <a
            href="/inscription"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-4 font-bold text-[#123BFF] transition hover:bg-blue-50"
          >
            Rejwenn Business Core
          </a>
        </div>
      </section>

      {/* KESYON YO POZE SOUVAN */}
      <section className="bg-white px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#123BFF]">
              Èd ak enfòmasyon
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Kesyon yo poze souvan
            </h2>

            <p className="mt-4 text-gray-600">
              Men kèk repons pou ede w pi byen konprann Business Core.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {questions.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition open:border-[#123BFF]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.question}

                  <span className="text-xl text-[#123BFF] transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-7 text-gray-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#123BFF] px-6 pb-6 pt-14 text-white lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 border-b border-white/25 pb-12 md:grid-cols-3">

          {/* Identité */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-bold text-[#123BFF]">
                BC
              </span>

              <span className="text-xl font-bold">Business Core</span>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
              Yon solisyon dijital pou ede biznis yo òganize aktivite yo,
              suiv enfòmasyon enpòtan epi pran pi bon desizyon.
            </p>
          </div>

          {/* Liens */}
          <div>
            <h3 className="font-bold">Dekouvri Business Core</h3>

            <ul className="mt-5 space-y-3 text-sm text-blue-100">
              <li>
                <a href="/" className="transition hover:text-white">
                  Akèy
                </a>
              </li>

              <li>
                <a
                  href="#fonksyonalite"
                  className="transition hover:text-white"
                >
                  Fonksyonalite
                </a>
              </li>

              <li>
                <a
                  href="#platfom-mesajri"
                  className="transition hover:text-white"
                >
                  WhatsApp ak Telegram
                </a>
              </li>

              <li>
                <a
                  href="/inscription"
                  className="transition hover:text-white"
                >
                  Kreye yon kont
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold">Kontakte nou</h3>

            <p className="mt-5 text-sm leading-7 text-blue-100">
              Ou gen yon kesyon oswa ou bezwen plis enfòmasyon sou
              Business Core? Ekri nou.
            </p>

            <a
              href="mailto:businesscore@gmail.com"
              className="mt-3 inline-block text-sm font-semibold text-white underline decoration-white/50 underline-offset-4 transition hover:decoration-white"
            >
              businesscore@gmail.com
            </a>

            <div className="mt-6">
              <a
                href="/inscription"
                className="inline-block rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#123BFF] transition hover:bg-blue-50"
              >
                Rejwenn Business Core
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 pt-6 text-center text-xs text-blue-100 sm:flex-row sm:text-left">
          <p>© 2026 Business Core. Tout dwa rezève.</p>
          <p>Teknoloji pou ede biznis ou avanse.</p>
        </div>
      </footer>

    </main>
  );
}

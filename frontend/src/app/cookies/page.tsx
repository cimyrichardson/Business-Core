import type { Metadata } from "next";
import LegalPage from "../LegalPage";

export const metadata: Metadata = {
  title: "Cookies ak depo lokal — Business Core",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies ak depo lokal"
      intro="Eksplikasyon sou ti enfòmasyon navigatè a ka kenbe pandan w ap itilize Business Core."
      sections={[
        {
          title: "Sesyon koneksyon",
          paragraphs: [
            "Aplikasyon an itilize Supabase Auth pou kenbe sesyon koneksyon an sou aparèy ou. Konfigirasyon aktyèl kliyan an pèmèt sesyon an rete nan depo lokal navigatè a pou w pa bezwen konekte chak fwa.",
          ],
        },
        {
          title: "Swivi ak piblisite",
          paragraphs: [
            "Nan kòd aplikasyon an kounye a, nou pa wè zouti analiz oswa piblisite ki mete cookies pou swiv itilizasyon. Si sèvis sa yo ajoute pita, paj sa a ak mekanis konsantman ki nesesè yo dwe mete ajou anvan yo aktive.",
          ],
        },
        {
          title: "Kontwòl ou",
          paragraphs: [
            "Ou ka efase depo lokal navigatè a nan paramèt navigatè ou. Lè w fè sa, sa ka dekonekte w epi w ap bezwen antre imèl ak modpas ou ankò.",
          ],
        },
      ]}
    />
  );
}

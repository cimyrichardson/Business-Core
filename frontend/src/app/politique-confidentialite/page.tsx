import type { Metadata } from "next";
import LegalPage from "../LegalPage";

export const metadata: Metadata = {
  title: "Konfidansyalite — Business Core",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Konfidansyalite"
      intro="Men ki enfòmasyon Business Core itilize pou kreye kont ou ak fè sèvis la mache."
      sections={[
        {
          title: "Enfòmasyon nou resevwa",
          paragraphs: [
            "Lè w kreye kont, ou bay non konplè ou, adrès imèl ou, non biznis ou ak modpas ou. Supabase Auth jere modpas la; aplikasyon Business Core pa li modpas ou.",
            "Lè fonksyon biznis yo disponib, enfòmasyon ou antre tankou pwodwi, lavant ak depans ka trete pou montre rapò yo mande a.",
          ],
        },
        {
          title: "Pouki nou itilize yo",
          bullets: [
            "Kreye epi pwoteje kont ou.",
            "Bay fonksyon aplikasyon an epi montre enfòmasyon ou mande yo.",
            "Reponn demann sipò epi kenbe sèvis la an sekirite.",
          ],
        },
        {
          title: "Kote ak kijan enfòmasyon yo estoke",
          paragraphs: [
            "Business Core itilize Supabase pou sèvis otantifikasyon ak baz done li. Sesyon koneksyon an rete sou aparèy navigatè ou pou aplikasyon an ka rekonèt kont ou. Konfigirasyon rejyon, kote egzak depo a ak peryòd retansyon an dwe konfime ak operatè sèvis la.",
          ],
        },
        {
          title: "Pataje enfòmasyon",
          paragraphs: [
            "Nou pa vann enfòmasyon pèsonèl ou. Enfòmasyon ki nesesè yo ka pase nan sèvis founisè teknik ki ede opere Business Core, tankou Supabase, oswa lè lalwa mande sa. Anvan lansman, operatè a dwe verifye kontra ak paramèt founisè sa yo.",
          ],
        },
        {
          title: "Dire retansyon ak demann ou",
          paragraphs: [
            "Pa gen kalandriye piblik pou efase done ki defini kounye a. Kontakte businesscore@gmail.com pou mande aksè, koreksyon oswa efasman enfòmasyon ki gen rapò ak kont ou; verifye idantite w ka nesesè.",
          ],
        },
        {
          title: "Kontak ak mizajou",
          paragraphs: [
            "Pou kestyon sou itilizasyon enfòmasyon ou, ekri businesscore@gmail.com. Nou ka mete paj sa a ajou lè fason sèvis la trete enfòmasyon chanje.",
          ],
        },
      ]}
    />
  );
}

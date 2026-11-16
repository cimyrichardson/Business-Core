import type { Metadata } from "next";
import LegalPage from "../LegalPage";

export const metadata: Metadata = {
  title: "Kondisyon itilizasyon — Business Core",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Kondisyon itilizasyon"
      intro="Règ sa yo esplike kijan pou itilize Business Core. Revize yo epi fè yon pwofesyonèl legal verifye yo anvan lansman."
      sections={[
        {
          title: "Kont ou",
          paragraphs: [
            "Bay enfòmasyon ki kòrèk lè w ap kreye kont epi pwoteje modpas ou. Ou responsab aktivite ki fèt sou kont ou. Kontakte nou si w panse yon lòt moun itilize kont lan san pèmisyon.",
          ],
        },
        {
          title: "Itilizasyon sèvis la",
          paragraphs: [
            "Ou ka itilize Business Core pou òganize enfòmasyon pwòp biznis ou. Pa itilize sèvis la pou vyole lalwa, twonpe lòt moun, eseye jwenn aksè san otorizasyon oswa deranje sèvis la.",
          ],
        },
        {
          title: "Enfòmasyon biznis ak desizyon",
          paragraphs: [
            "Ou rete responsab presizyon enfòmasyon ou antre ak desizyon ou pran apati rapò oswa rezime yo. Business Core pa ranplase konsèy yon kontab, konseye finansye oswa pwofesyonèl legal.",
            "Egzanp sou paj piblik yo se demonstrasyon sèlman. Fonksyon ki poko konekte ak done reyèl pa dwe konsidere kòm sèvis aktif.",
          ],
        },
        {
          title: "Disponibilite",
          paragraphs: [
            "Sèvis la ap devlope. Fonksyon yo ka chanje, sispann oswa vin tanporèman pa disponib pandan antretyen. Operatè a dwe ajoute pwosedi sipò, disponiblite ak limit responsablite anvan lansman.",
          ],
        },
        {
          title: "Kontak ak chanjman",
          paragraphs: [
            "Pou kestyon, ekri businesscore@gmail.com. Kondisyon sa yo ka chanje lè sèvis la evolye; dat mizajou ki anlè paj la montre dènye revizyon an.",
          ],
        },
      ]}
    />
  );
}

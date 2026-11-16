import type { Metadata } from "next";
import LegalPage from "../LegalPage";

export const metadata: Metadata = {
  title: "Nòt legal — Business Core",
};

export default function LegalNoticePage() {
  return (
    <LegalPage
      title="Nòt legal"
      intro="Enfòmasyon pou idantifye moun oswa antite ki responsab sit Business Core la."
      sections={[
        {
          title: "Piblikatè sit la",
          paragraphs: [
            "Non sèvis la: Business Core. Imèl kontak piblik ki parèt sou sit la: businesscore@gmail.com.",
            "Non legal antite ki pibliye sèvis la, fòm legal li, adrès biwo prensipal li, nimewo anrejistreman li ak non direktè piblikasyon an poko disponib. Se pwopriyetè sèvis la ki dwe ranpli enfòmasyon sa yo anvan lansman piblik.",
          ],
        },
        {
          title: "Hosting",
          paragraphs: [
            "Non ak adrès founisè ki host sit entènèt la poko konfime. Ranpli detay founisè hosting lan ak adrès kontak li anvan piblikasyon.",
          ],
        },
        {
          title: "Kontni ak responsablite",
          paragraphs: [
            "Business Core bay zouti pou òganize enfòmasyon biznis. Egzanp ki parèt sou paj piblik yo se demonstrasyon, yo pa reprezante done yon biznis reyèl ni konsèy kontab oswa finansye.",
          ],
        },
      ]}
    />
  );
}

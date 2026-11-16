import type { Metadata } from "next";
import WorkspaceSection from "../WorkspaceSection";

export const metadata: Metadata = {
  title: "Mesaj ak rapò — Business Core",
};

export default function ChannelsPage() {
  return (
    <WorkspaceSection
      title="Mesaj ak rapò"
      description="Jere chanèl WhatsApp ak Telegram, ansanm ak rapò ak alèt yo."
    />
  );
}

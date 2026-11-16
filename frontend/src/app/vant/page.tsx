import type { Metadata } from "next";
import WorkspaceSection from "../WorkspaceSection";

export const metadata: Metadata = {
  title: "Vant — Business Core",
};

export default function SalesPage() {
  return (
    <WorkspaceSection
      title="Vant"
      description="Swiv lavant yo epi konsilte istwa tranzaksyon biznis ou."
    />
  );
}

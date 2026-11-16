import type { Metadata } from "next";
import WorkspaceSection from "../WorkspaceSection";

export const metadata: Metadata = {
  title: "Asistan — Business Core",
};

export default function AssistantPage() {
  return (
    <WorkspaceSection
      title="Asistan"
      description="Poze kesyon sou lavant, depans ak stòk biznis ou."
    />
  );
}

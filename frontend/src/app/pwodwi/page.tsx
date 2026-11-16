import type { Metadata } from "next";
import WorkspaceSection from "../WorkspaceSection";

export const metadata: Metadata = {
  title: "Pwodwi ak stòk — Business Core",
};

export default function ProductsPage() {
  return (
    <WorkspaceSection
      title="Pwodwi ak stòk"
      description="Jere pwodwi yo, pri yo, kantite ki rete ak nivo alèt stòk la."
    />
  );
}

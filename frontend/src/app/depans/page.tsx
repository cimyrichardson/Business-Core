import type { Metadata } from "next";
import WorkspaceSection from "../WorkspaceSection";

export const metadata: Metadata = {
  title: "Depans — Business Core",
};

export default function ExpensesPage() {
  return (
    <WorkspaceSection
      title="Depans"
      description="Anrejistre depans yo dapre kategori ak dat."
    />
  );
}

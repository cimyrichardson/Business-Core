import type { Metadata } from "next";
import ExpensesContent from "./ExpensesContent";

export const metadata: Metadata = {
  title: "Depans — Business Core",
};

export default function ExpensesPage() {
  return <ExpensesContent />;
}

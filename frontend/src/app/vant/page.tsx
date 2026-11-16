import type { Metadata } from "next";
import SalesContent from "./SalesContent";

export const metadata: Metadata = {
  title: "Vant — Business Core",
};

export default function SalesPage() {
  return <SalesContent />;
}

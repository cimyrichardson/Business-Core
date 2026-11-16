import type { Metadata } from "next";
import ProductsContent from "./ProductsContent";

export const metadata: Metadata = {
  title: "Pwodwi ak stòk — Business Core",
};

export default function ProductsPage() {
  return <ProductsContent />;
}

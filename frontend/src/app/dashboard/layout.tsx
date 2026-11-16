import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tablo bò — Business Core",
  description:
    "Chif dafè, depans, kantite vant ak stòk ba boutik ou an yon sèl kote.",
  openGraph: {
    title: "Tablo bò — Business Core",
    description: "Chif dafè, depans ak stòk boutik ou an goud.",
  },
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}


import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Core",
  description: "Platefòm jesyon biznis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ht" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
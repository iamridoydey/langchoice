import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LangChoice — Vote for your language",
  description: "A community poll for your favourite programming language.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

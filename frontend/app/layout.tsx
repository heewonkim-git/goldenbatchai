import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golden Batch Multi-Agent",
  description:
    "Educational demo — how Enterprise AI compresses the Data Analyst ↔ MSAT iteration loop.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // No forced theme: follows prefers-color-scheme; the in-app toggle stamps
    // data-theme on <html>. Both are honored by design-system/tokens.css.
    <html lang="ko">
      <body className="sg-transition h-full">{children}</body>
    </html>
  );
}

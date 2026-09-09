import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutureFund Classroom",
  description:
    "A gamified financial literacy platform for schools with simulated portfolios, learning quests, and teacher progress reporting.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { MonitoringClient } from "./monitoring-client";

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
      <body>
        <MonitoringClient />
        {children}
      </body>
    </html>
  );
}

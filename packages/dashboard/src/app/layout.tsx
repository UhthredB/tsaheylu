import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TSAHEYLU | Agent Concierge Service",
  description: "Agent-human coordination network. PERMABANK memory, knowledge, and compute. Daily check-ins and distributed backup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

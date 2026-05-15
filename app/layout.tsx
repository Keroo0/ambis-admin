import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "STAKAD SMAN 07 — Admin",
  description: "Admin dashboard SMAN 07 Smart Attendance System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="h-full" style={{ backgroundColor: '#f7f9fb' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

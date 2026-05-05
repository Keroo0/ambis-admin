import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

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
        <Sidebar />
        <Header />
        <main style={{ marginLeft: 240, paddingTop: 56, minHeight: '100vh' }}>
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}

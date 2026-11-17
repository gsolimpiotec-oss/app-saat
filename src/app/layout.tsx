import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionGuard } from "@/components/SessionGuard";
import { PwaRegister } from "@/components/PwaRegister";
import { InstallBanner } from "@/components/InstallBanner";

const InterSans = Inter({
  variable: "--font-Inter-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAAT - Sistema de Acompanhamento do Aluno Trabalhador",
  description: "Acompanhe seu desempenho escolar e concilie trabalho e estudo.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SAAT",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${InterSans.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full bg-slate-200 md:bg-slate-200">
        <SessionGuard />
        <PwaRegister />
        <InstallBanner />
        {children}
      </body>
    </html>
  );
}
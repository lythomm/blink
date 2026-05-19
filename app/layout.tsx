import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "./ClientLayoutWrapper";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blink - Caméra Jetable",
  description: "Capturez vos souvenirs d'événements avec style.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-neutral text-primary antialiased selection:bg-white selection:text-black flex flex-col overflow-x-hidden">
        <ConvexAuthNextjsServerProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}

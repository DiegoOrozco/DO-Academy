import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAuthUser } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "DO Academy",
  description: "Plataforma de cursos premium",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthUser();

  return (
    <html lang="es">
      <body className="antialiased font-display">
        {/* Global Navigation - Fixed at top */}
        <Navbar user={user} />

        {children}

        {/* Global Footer */}
        <Footer user={user} />
        <SpeedInsights />
      </body>
    </html>
  );
}

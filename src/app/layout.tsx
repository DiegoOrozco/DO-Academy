import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getStudent } from "@/lib/student-auth";
import { logoutStudent } from "@/actions/auth";

export const metadata: Metadata = {
  title: "DO Academy",
  description: "Plataforma de cursos premium",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const student = await getStudent();

  return (
    <html lang="es">
      <body className="antialiased font-display">
        {/* Global Navigation - Fixed at top */}
        <Navbar student={student} logoutAction={logoutStudent} />

        {children}

        {/* Global Footer */}
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}

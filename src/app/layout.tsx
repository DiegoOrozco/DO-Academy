import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAuthUser } from "@/lib/auth-utils";
import { getSiteConfig } from "@/lib/config";

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
  const aboutConfig = await getSiteConfig("about");

  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-display">
        {/* Global Navigation - Fixed at top */}
        <Navbar user={user} />

        {children}

        {/* Global Footer */}
        <Footer user={user} aboutConfig={aboutConfig} />
        <SpeedInsights />
      </body>
    </html>
  );
}

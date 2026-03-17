import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { TopBar } from "@/components/layout/TopBar";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "ABSURD",
  description: "Personal data dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ABSURD",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {session && <TopBar user={session.user} />}
          <main className="min-h-screen" style={{ background: "var(--bg)" }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

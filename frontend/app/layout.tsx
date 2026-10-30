import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AccessibilityWrapper from "@/components/AccessibilityWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AHEAD — AI-Powered Accessibility & Inclusion Platform",
  description: "Feel ready. Be understood. Go independently. Accessibility platform for booking services, simplifying visits with Gemini AI, and communicating real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AccessibilityWrapper>
            <Navbar />
            <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-[calc(100vh-4rem)]">
              {children}
            </main>
          </AccessibilityWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

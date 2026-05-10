import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: {
    default: "IntervAI - AI Mock Interview Platform",
    template: "%s | IntervAI",
  },
  description:
    "Master your interviews with AI-powered mock sessions, STAR scoring, voice practice, and personalized feedback.",
  keywords: [
    "mock interview",
    "AI interview",
    "behavioral interview",
    "STAR method",
    "interview practice",
    "job interview",
  ],
  authors: [{ name: "IntervAI" }],
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    title: "IntervAI - AI Mock Interview Platform",
    description: "Master your interviews with AI-powered practice sessions",
    siteName: "IntervAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntervAI - AI Mock Interview Platform",
    description: "Master your interviews with AI-powered practice sessions",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen">
        <TooltipProvider delayDuration={300}>
          <ToastProvider />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/shared/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nudge",
  description: "A simple, colourful habit tracker.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={{ variables: { colorPrimary: "#6d4bc4" } }}>
          <Navbar />
          {/* Pages read the session at request time, so they stream inside this boundary */}
          <Suspense fallback={null}>{children}</Suspense>
        </ClerkProvider>
      </body>
    </html>
  );
}

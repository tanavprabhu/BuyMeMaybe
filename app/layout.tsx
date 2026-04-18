import type { Metadata } from "next";
import { Patrick_Hand, Quicksand } from "next/font/google";
import { PhoneShell } from "../components/PhoneShell";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

const display = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "BuyMeMaybe",
  description: "A TikTok-style feed of items that sell themselves.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <PhoneShell>{children}</PhoneShell>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientAuthPopup from "./shared/ClientAuthPopup";
import NextAuthProvider from "./components1/NextAuthProvider";
import ConditionalAppointmentButton from "./components1/ConditionalAppointmentButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KGH",
  description: "Premium Arms Dealers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          {children}
          <ClientAuthPopup />
          <ConditionalAppointmentButton />
        </NextAuthProvider>
      </body>
    </html>
  );
}

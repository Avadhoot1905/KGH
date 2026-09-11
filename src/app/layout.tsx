import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientAuthPopup from "./shared/ClientAuthPopup";
import NextAuthProvider from "./components1/NextAuthProvider";
import ConditionalAppointmentButton from "./components1/ConditionalAppointmentButton";
import ConditionalFeedbackButton from "./components1/ConditionalFeedbackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://buyairgunsindia.in"),
  title: {
    default: "Kathuria Gun House | Buy Airguns, Air Pistols & Firearms in India",
    template: "%s | Kathuria Gun House",
  },
  description: "Kathuria Gun House is India's leading dealer of air guns, air pistols, target rifles, pellets, and shooting accessories. Authorized Service Centre for Precihole Sports in Malout, Punjab.",
  keywords: [
    "Kathuria Gun House",
    "Kathuria Gun House Malout",
    "Buy Airguns online India",
    "Air pistol price India",
    ".177 air rifle India",
    "Precihole Sports authorized dealer",
    "Airgun shop near me",
    "Firearms dealer Punjab",
    "Target shooting airguns India",
    "Airgun pellets online India",
    "Kathuria gun house arms dealer",
    "Air gun without license India"
  ],
  alternates: {
    canonical: "https://buyairgunsindia.in",
  },
  openGraph: {
    title: "Kathuria Gun House | Premium Airguns & Firearms Dealer India",
    description: "Explore 100% genuine airguns, air pistols, target rifles, and accessories with nationwide fast shipping across India.",
    url: "https://buyairgunsindia.in",
    siteName: "Kathuria Gun House",
    images: [
      {
        url: "/photos/hero.png",
        width: 1200,
        height: 630,
        alt: "Kathuria Gun House Airguns and Firearms",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kathuria Gun House | Airguns & Firearms India",
    description: "Authorized Precihole Sports dealer offering top quality airguns, rifles, and target shooting gear in India.",
    images: ["/photos/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@type": "SportingGoodsStore",
  "name": "Kathuria Gun House",
  "image": "https://buyairgunsindia.in/photos/hero.png",
  "@id": "https://buyairgunsindia.in",
  "url": "https://buyairgunsindia.in",
  "telephone": "+91-9814346000",
  "priceRange": "₹₹",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Tehsil Road",
    "addressLocality": "Malout",
    "addressRegion": "Punjab",
    "postalCode": "152107",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 30.1973,
    "longitude": 74.4984
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ],
    "opens": "10:00",
    "closes": "19:00"
  },
  "sameAs": [
    "https://www.facebook.com/kathuriagunhouse/",
    "https://www.youtube.com/@kathuriagunhousearmsammuna4618"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          {children}
          <ClientAuthPopup />
          <ConditionalAppointmentButton />
          <ConditionalFeedbackButton />
        </NextAuthProvider>
      </body>
    </html>
  );
}

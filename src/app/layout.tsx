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
    default: "Kathuria Gun House | Buy Air Guns Online India - Air Pistols, Air Rifles & Accessories",
    template: "%s | Kathuria Gun House - Air Guns India",
  },
  description: "Kathuria Gun House - Buy Air Guns Online Cash on Delivery in India. Shop Air Guns with Scope, Air Guns for Self Defense, Air Gun Rifles under 3000, Air Guns under 1000 COD, Air Gun Revolvers, Air Pistols, .177 Air Rifles & Precihole Sports products without license.",
  keywords: [
    "Kathuria Gun House",
    "Kathuria Gun House Malout",
    "Air gun online cash on delivery",
    "Air gun With Scope price in India",
    "Air guns for self defense",
    "Air gun rifle under 3000",
    "Air Gun under 1000 Cash on delivery",
    "Air gun price in India",
    "Air Gun price in Amazon",
    "Air gun Revolver",
    "Buy Airguns online India",
    "Air pistol price India",
    ".177 air rifle India",
    "Precihole Sports authorized dealer",
    "Airgun shop near me",
    "Firearms dealer Punjab",
    "Target shooting airguns India",
    "Airgun pellets online India",
    "Kathuria gun house arms dealer",
    "Air gun without license India",
    "CO2 air pistol India",
    "Pellet gun price India",
    "Air gun store online",
    "Original air gun dealer India",
    "Best air rifle for target practice India",
    "Air gun 0.177 caliber price",
    "Break barrel air rifle India",
    "PCP air rifle price India",
    "Air gun scope price India",
    "Air gun cover online India",
    "Air gun bullets price",
    "Air gun shop in Punjab",
    "Air gun Malout Punjab",
    "Air pistol without license",
    "Metal body air gun price",
    "Air gun for home defense India",
    "High power air rifle India",
    "Sports air gun India",
    "Air gun accessories India",
    "Compressed air gun price",
    "Air gun under 2000 India",
    "Air gun under 5000 India",
    "Air gun home delivery India",
    "Indian air gun online store",
    "Precihole air rifle price",
    "Precihole air pistol online",
    "Best air pistol in India",
    "Air gun gun house Malout",
    "Air gun cash on delivery near me",
    "Air gun online shopping India"
  ],
  alternates: {
    canonical: "https://buyairgunsindia.in",
  },
  openGraph: {
    title: "Kathuria Gun House | Buy Air Guns Online India - Cash On Delivery Available",
    description: "Explore 100% genuine air guns, air pistols, target rifles, scopes, and accessories with nationwide cash on delivery across India.",
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
    title: "Kathuria Gun House | Buy Air Guns Online India",
    description: "Authorized Precihole Sports dealer offering air guns with scope, air pistols, revolvers & air rifles with Cash on Delivery in India.",
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
  "description": "India's premier online dealer for Air Guns, Air Pistols, Air Rifles with Scope, Revolvers, and Accessories. Offering nationwide Cash on Delivery (COD). Authorized Precihole Sports dealer.",
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

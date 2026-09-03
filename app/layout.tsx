import type { Metadata, Viewport } from "next";
import { SITE } from "@/config/site";
import { META } from "@/content";
import "./globals.css";

/**
 * Root layout loads NO fonts on purpose. The site route group and the legal
 * section each load only the faces they use, so /legal does not pay to
 * download the display faces the marketing pages need.
 */

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: META.home.title,
    template: `%s · ${SITE.name}`,
  },
  description: META.home.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: META.home.title,
    description: META.home.description,
    url: SITE.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: META.home.title,
    description: META.home.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

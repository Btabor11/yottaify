import type { Metadata } from "next";
import { META, PRIVACY } from "@/content";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = {
  title: META.legal.privacy.title,
  description: META.legal.privacy.description,
  // A draft policy must not be the page that ranks for the company name.
  robots: { index: false, follow: true },
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title={META.legal.privacy.h1}
      updated={PRIVACY.updated}
      sections={PRIVACY.sections}
    />
  );
}

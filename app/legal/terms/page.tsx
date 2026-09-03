import type { Metadata } from "next";
import { META, TERMS } from "@/content";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = {
  title: META.legal.terms.title,
  description: META.legal.terms.description,
  robots: { index: false, follow: true },
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title={META.legal.terms.h1} updated={TERMS.updated} sections={TERMS.sections} />
  );
}

import type { Metadata } from "next";
import { META } from "@/content";
import { D1Nav, D1StatusStrip } from "@/components/d1/Chrome";
import { Hero } from "@/components/d1/Hero";
import { LeadTimeBand, PricingSection } from "@/components/d1/PricingSection";
import { SpecsSection } from "@/components/d1/SpecsSection";
import { ReserveSection } from "@/components/d1/ReserveSection";
import { OperatorSection } from "@/components/d1/OperatorSection";
import { D1Footer } from "@/components/d1/Footer";

export const metadata: Metadata = {
  title: META.home.title,
  description: META.home.description,
  alternates: { canonical: "/d1" },
};

export default function D1Page() {
  return (
    <>
      <D1Nav />
      <main id="main">
        <Hero />
        <D1StatusStrip />
        <LeadTimeBand />
        <PricingSection />
        <SpecsSection />
        <ReserveSection />
        <OperatorSection />
      </main>
      <D1Footer />
    </>
  );
}

import type { Metadata } from "next";
import { META } from "@/content";
import { D3Nav, D3Rail } from "@/components/d3/Chrome";
import { Hero } from "@/components/d3/Hero";
import { PricingBay } from "@/components/d3/PricingBay";
import { SpecsBay } from "@/components/d3/SpecsBay";
import { ReserveBay } from "@/components/d3/ReserveBay";
import { OperatorBay } from "@/components/d3/OperatorBay";
import { D3Footer } from "@/components/d3/Footer";

export const metadata: Metadata = {
  title: META.home.title,
  description: META.home.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <D3Nav />
      <D3Rail />
      <main id="main">
        <Hero />
        <PricingBay />
        <SpecsBay />
        <ReserveBay />
        <OperatorBay />
      </main>
      <D3Footer />
    </>
  );
}

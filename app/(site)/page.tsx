import type { Metadata } from "next";
import { META } from "@/content";
import { D3Nav } from "@/components/d3/Chrome";
import { Story } from "@/components/d3/story/Story";
import { Paperwork } from "@/components/d3/Paperwork";
import { PricingBay } from "@/components/d3/PricingBay";
import { SpecsBay } from "@/components/d3/SpecsBay";
import { OperatorBay } from "@/components/d3/OperatorBay";
import { AssuranceBay } from "@/components/d3/AssuranceBay";
import { ProcessBay } from "@/components/d3/ProcessBay";
import { FaqBay } from "@/components/d3/FaqBay";
import { ReserveBay } from "@/components/d3/ReserveBay";
import { D3Footer } from "@/components/d3/Footer";
import { faqJsonLd } from "@/components/shared/faqSchema";

export const metadata: Metadata = {
  title: META.home.title,
  description: META.home.description,
  alternates: { canonical: "/" },
};

/**
 * Two halves. The story is dark and felt; the paperwork is light and checked.
 * `.d3-paper` rebinds every semantic token for the second half, so the same
 * components are correct on both grounds without knowing which they are on.
 */
export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />
      <D3Nav />
      <main id="main">
        <Story />
        <div className="d3-paper relative z-[2]">
          <Paperwork />
          <PricingBay />
          <SpecsBay />
          <OperatorBay />
          <AssuranceBay />
          <ProcessBay />
          <FaqBay />
          <ReserveBay />
        </div>
      </main>
      <D3Footer />
    </>
  );
}

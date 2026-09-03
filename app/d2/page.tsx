import type { Metadata } from "next";
import { META } from "@/content";
import { D2Masthead } from "@/components/d2/Chrome";
import { Cover } from "@/components/d2/Cover";
import { Ledger } from "@/components/d2/Ledger";
import { SpecsSpread } from "@/components/d2/SpecsSpread";
import { ReserveChapter } from "@/components/d2/ReserveChapter";
import { Colophon } from "@/components/d2/Colophon";
import { Footer } from "@/components/d2/Footer";

export const metadata: Metadata = {
  title: META.home.title,
  description: META.home.description,
  alternates: { canonical: "/d2" },
};

export default function D2Page() {
  return (
    <>
      <D2Masthead />
      <main id="main">
        <Cover />
        <Ledger />
        <SpecsSpread />
        <ReserveChapter />
        <Colophon />
      </main>
      <Footer />
    </>
  );
}

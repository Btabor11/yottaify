import { SITE } from "@/config/site";
import { FAQS } from "@/content";

/**
 * FAQPage JSON-LD for the home page. The strings are the same ones rendered in
 * the FAQ sheet, by construction — nothing is claimed here that is not on the
 * page in the same words.
 */
export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE.url}/#faq`,
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

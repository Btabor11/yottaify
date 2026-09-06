import { SITE } from "@/config/site";
import { PRICE_ROWS, QUOTE, GPU, SPECS, META, source, FLEET } from "@/content";

/**
 * JSON-LD for the pricing page.
 *
 * /pricing is the page meant to rank for the searches our buyers actually run,
 * so it gets structured data. Only facts that appear visibly on the page are
 * described here — structured data that claims more than the page shows is how
 * sites get manual actions.
 *
 * The Offer deliberately carries no `price`. The page does not show one, so
 * emitting one here would be exactly that mismatch, and it would put a figure
 * into search results and assistant answers that we have not published
 * anywhere a human can read. `PriceSpecification` with a description is the
 * honest encoding of "quoted on request".
 */
export function pricingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/pricing`,
        name: META.pricing.h1,
        description: META.pricing.description,
        dateModified: SITE.pricingAsOf,
        isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
      },
      {
        "@type": "Product",
        name: `${GPU.fullName} bare-metal GPU capacity`,
        description: `${FLEET.shape} ${GPU.fullName} (${GPU.architectureName}). Bare metal, SSH and a scheduler. Target availability ${SITE.availability}.`,
        brand: { "@type": "Brand", name: SITE.name },
        additionalProperty: SPECS.map((s) => ({
          "@type": "PropertyValue",
          name: s.longLabel,
          value: `${s.approx ? "~" : ""}${s.value}${s.unit ? ` ${s.unit}` : ""}`,
        })),
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          availability: "https://schema.org/PreOrder",
          availabilityStarts: "2026-11-01",
          url: `${SITE.url}/pricing`,
          description: `${QUOTE.label}. ${QUOTE.position}.`,
          priceSpecification: {
            "@type": "PriceSpecification",
            priceCurrency: "USD",
            // Per GPU-hour. UN/CEFACT HUR = hour.
            unitCode: "HUR",
            description: QUOTE.why,
          },
        },
      },
      {
        "@type": "Dataset",
        name: `Published ${GPU.model} rental rates`,
        description: META.pricing.standfirst,
        dateModified: SITE.pricingAsOf,
        creator: { "@type": "Organization", name: SITE.name },
        citation: PRICE_ROWS.map((r) => source(r.sourceId))
          .filter((s) => s.url)
          .map((s) => ({ "@type": "CreativeWork", name: s.label, url: s.url })),
      },
    ],
  };
}

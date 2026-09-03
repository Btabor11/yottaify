import { SITE } from "@/config/site";
import { PRICE_ROWS, RATE, GPU, SPECS, META, source, FLEET } from "@/content";

/**
 * JSON-LD for the pricing page.
 *
 * /pricing is the page meant to rank for the searches our buyers actually run,
 * so it gets structured data. Only facts that appear visibly on the page are
 * described here — structured data that claims more than the page shows is how
 * sites get manual actions.
 */
export function pricingJsonLd() {
  const ours = PRICE_ROWS.find((r) => r.isUs)!;

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
          price: ours.low,
          priceCurrency: "USD",
          // Per GPU-hour. UN/CEFACT HUR = hour.
          unitCode: "HUR",
          availability: "https://schema.org/PreOrder",
          availabilityStarts: "2026-11-01",
          priceValidUntil: "2026-12-31",
          url: `${SITE.url}/pricing`,
          description: `${RATE.full}, on-demand.`,
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

import type { Metadata } from "next";
import { MARKET } from "@/content/market";
import { getMarketStore } from "@/lib/market/store";
import { MarketDashboard } from "@/components/market/MarketDashboard";
import { D3Nav } from "@/components/d3/Chrome";
import { D3Footer } from "@/components/d3/Footer";

export const metadata: Metadata = {
  title: MARKET.meta.title,
  description: MARKET.meta.description,
  alternates: { canonical: "/market" },
};

/** Data changes once a day; revalidate hourly so a manual re-run shows up soon. */
export const revalidate = 3600;

export default async function MarketPage() {
  const store = getMarketStore();
  const [latest, history] = await Promise.all([store.latest(), store.history(90)]);
  return (
    <>
      <D3Nav onPricingPage />
      <main id="main" className="mx-auto w-full max-w-[96rem] px-5 pb-32 pt-28 md:px-10 md:pt-36">
        <MarketDashboard latest={latest} history={history} />
      </main>
      <D3Footer reserveHref="/#reserve" />
    </>
  );
}

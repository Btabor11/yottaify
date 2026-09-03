import { d2FontClass } from "./fonts";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { DirectionSwitcher } from "@/components/shared/DirectionSwitcher";
import "./d2.css";

export default function D2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`d2 ${d2FontClass} min-h-dvh`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Paper tooth. Multiply-blended, so it darkens the stock rather than
          glowing over it the way D1's grain does. */}
      <div aria-hidden className="grain" />

      {/* D2 scrolls slower and with more inertia than D1 — a document being
          turned rather than an instrument being panned. */}
      <SmoothScroll duration={1.35} wheelMultiplier={0.82} />

      {children}

      <DirectionSwitcher current="d2" />
    </div>
  );
}

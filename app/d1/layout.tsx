import { d1FontClass } from "./fonts";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { DirectionSwitcher } from "@/components/shared/DirectionSwitcher";
import { RevealRoot } from "@/components/d1/Reveal";
import "./d1.css";

export default function D1Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`d1 ${d1FontClass} min-h-dvh`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Fine grain over the whole page. Fixed, so it never repaints on scroll. */}
      <div aria-hidden className="grain" />

      <SmoothScroll />
      <RevealRoot />

      {children}

      <DirectionSwitcher current="d1" />
    </div>
  );
}

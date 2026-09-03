import { d3FontClass } from "./fonts";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { DirectionSwitcher } from "@/components/shared/DirectionSwitcher";
import { Field } from "@/components/d3/Field";
import "./d3.css";

export default function D3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`d3 ${d3FontClass} min-h-dvh`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Coarse, screen-blended grain: this direction is emission, not film. */}
      <div aria-hidden className="grain" />

      {/* Tighter and faster than D2 — an instrument that tracks the input. */}
      <SmoothScroll duration={0.85} wheelMultiplier={1.05} />

      {/* Phase (the live accent), variable-width type, and scroll reveals. */}
      <Field />

      {children}

      <DirectionSwitcher current="d3" />
    </div>
  );
}

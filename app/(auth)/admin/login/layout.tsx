import type { Metadata } from "next";
import { SITE } from "@/config/site";
import { ADMIN } from "@/content";
import { adminFontClass } from "@/app/admin/fonts";
import "@/app/admin/admin.css";

export const metadata: Metadata = {
  title: `${ADMIN.login.heading} · ${SITE.name}`,
  robots: { index: false, follow: false },
};

/**
 * The login page sits outside app/admin so it does not inherit the desk's
 * layout, which reads the store and shows navigation the visitor cannot use
 * yet. Same palette, no chrome, and no store call — an unauthenticated
 * request must not be able to make the database do work.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className={`admin ${adminFontClass} flex min-h-dvh flex-col`}>{children}</div>;
}

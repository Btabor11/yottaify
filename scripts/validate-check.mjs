/**
 * Truth table for the reservation schema. Run after any change to
 * `lib/validation.ts` — the schema is the only thing standing between a real
 * lead and a dropped one, and it is shared by the client, the submit helper
 * and the API route.
 *
 * node scripts/validate-check.mjs
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { validateReservation } from "../lib/validation.ts";

const ok = {
  company: "Northwind Research",
  name: "Dana Okafor",
  email: "dana@northwind.dev",
  gpuCount: "8",
  startDate: "2027-01-15",
  workload: "serving",
  notes: "Serving a 400B model.",
};

const CASES = [
  ["a complete, valid submission", ok, true],
  ["whitespace is trimmed", { ...ok, company: "  Northwind  " }, true, (d) => d.company === "Northwind"],
  ["notes may be omitted", { ...ok, notes: undefined }, true],
  ["notes may be empty", { ...ok, notes: "" }, true],
  ["missing company", { ...ok, company: "" }, false, null, "company"],
  ["whitespace-only company", { ...ok, company: "   " }, false, null, "company"],
  ["company over 120 chars", { ...ok, company: "x".repeat(121) }, false, null, "company"],
  ["missing name", { ...ok, name: "" }, false, null, "name"],
  ["missing email", { ...ok, email: "" }, false, null, "email"],
  ["malformed email", { ...ok, email: "not-an-email" }, false, null, "email"],
  ["free-mail domain", { ...ok, email: "dana@gmail.com" }, false, null, "email"],
  ["free-mail, mixed case", { ...ok, email: "dana@GMail.com" }, false, null, "email"],
  ["unknown gpuCount", { ...ok, gpuCount: "900" }, false, null, "gpuCount"],
  ["empty gpuCount", { ...ok, gpuCount: "" }, false, null, "gpuCount"],
  ["unknown workload", { ...ok, workload: "mining" }, false, null, "workload"],
  ["empty startDate", { ...ok, startDate: "" }, false, null, "startDate"],
  ["malformed startDate", { ...ok, startDate: "15/01/2027" }, false, null, "startDate"],
  ["impossible startDate", { ...ok, startDate: "2027-02-31" }, false, null, "startDate"],
  ["startDate in the past", { ...ok, startDate: "2020-01-01" }, false, null, "startDate"],
  ["notes over 2000 chars", { ...ok, notes: "x".repeat(2001) }, false, null, "notes"],
  ["a non-object", "nope", false],
  ["null", null, false],
  ["extra fields are ignored", { ...ok, isAdmin: true }, true],
];

let failures = 0;
for (const [label, input, shouldPass, assertData, expectField] of CASES) {
  const r = validateReservation(input);
  const passed = r.ok === shouldPass;
  const fieldOk = !expectField || (!r.ok && Boolean(r.errors[expectField]));
  const dataOk = !assertData || (r.ok && assertData(r.data));
  const good = passed && fieldOk && dataOk;
  if (!good) failures++;
  const detail = r.ok ? "" : Object.entries(r.errors).map(([k, v]) => `${k}: ${v}`).join(" | ");
  console.log(`  ${good ? "ok  " : "FAIL"}  ${label.padEnd(30)} ${good ? "" : detail}`);
}

// Every message the user can see should read like a person wrote it.
const r = validateReservation({});
if (!r.ok) {
  console.log("\n  messages shown on an empty submit:");
  for (const [k, v] of Object.entries(r.errors)) {
    const shouty = /^(Invalid|Required|Expected|String must)/.test(v);
    if (shouty) failures++;
    console.log(`  ${shouty ? "FAIL" : "ok  "}  ${k.padEnd(12)} ${v}`);
  }
}

console.log(`\n  ${failures ? `${failures} failing case(s)` : `all ${CASES.length} cases pass`}\n`);
process.exit(failures ? 1 : 0);

/**
 * Identity of the company that operates the hosted AnyChat service. It shows
 * up on the legal pages (terms, privacy, data deletion) and in the site
 * footer, and Meta checks it against the business verification during App
 * Review. Set the NEXT_PUBLIC_COMPANY_* variables before going public; the
 * "[preencher …]" fallbacks are deliberately obvious so a missing value is
 * caught on review instead of shipping a made-up identity.
 *
 * Each variable is read with a literal `process.env.NAME` so Next.js can
 * inline it at build time (pages using it are statically rendered).
 */
const PLACEHOLDER = (field: string) => `[preencher ${field}]`;

function value(raw: string | undefined, field: string): string {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : PLACEHOLDER(field);
}

export interface CompanyInfo {
  /** Razão social, e.g. "AnyChat Tecnologia Ltda." */
  name: string;
  /** CNPJ formatted as 00.000.000/0000-00 */
  cnpj: string;
  /** Contact and privacy (DPO/encarregado) email */
  email: string;
  /** Registered address */
  address: string;
}

export const company: CompanyInfo = {
  name: value(process.env.NEXT_PUBLIC_COMPANY_NAME, "razão social"),
  cnpj: value(process.env.NEXT_PUBLIC_COMPANY_CNPJ, "CNPJ"),
  email: value(process.env.NEXT_PUBLIC_COMPANY_EMAIL, "e-mail de contato"),
  address: value(process.env.NEXT_PUBLIC_COMPANY_ADDRESS, "endereço"),
};

/** True when every company field is configured (no placeholder left). */
export function isCompanyConfigured(info: CompanyInfo = company): boolean {
  return Object.values(info).every((field) => !field.startsWith("[preencher"));
}

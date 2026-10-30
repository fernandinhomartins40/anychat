import { afterEach, describe, expect, it, vi } from "vitest";

const KEYS = [
  "NEXT_PUBLIC_COMPANY_NAME",
  "NEXT_PUBLIC_COMPANY_CNPJ",
  "NEXT_PUBLIC_COMPANY_EMAIL",
  "NEXT_PUBLIC_COMPANY_ADDRESS",
] as const;

async function loadCompany(env: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const key of KEYS) vi.stubEnv(key, env[key] ?? "");
  vi.resetModules();
  return import("../lib/company");
}

describe("company identity", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows obvious placeholders while the env vars are unset or blank", async () => {
    const { company, isCompanyConfigured } = await loadCompany({
      NEXT_PUBLIC_COMPANY_NAME: "   ",
    });
    expect(company.name).toBe("[preencher razão social]");
    expect(company.cnpj).toBe("[preencher CNPJ]");
    expect(company.email).toBe("[preencher e-mail de contato]");
    expect(company.address).toBe("[preencher endereço]");
    expect(isCompanyConfigured()).toBe(false);
  });

  it("uses the configured values, trimmed", async () => {
    const { company, isCompanyConfigured } = await loadCompany({
      NEXT_PUBLIC_COMPANY_NAME: " Exemplo Ltda. ",
      NEXT_PUBLIC_COMPANY_CNPJ: "00.000.000/0001-00",
      NEXT_PUBLIC_COMPANY_EMAIL: "privacidade@example.com",
      NEXT_PUBLIC_COMPANY_ADDRESS: "Rua Exemplo, 1",
    });
    expect(company.name).toBe("Exemplo Ltda.");
    expect(isCompanyConfigured()).toBe(true);
  });
});

import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import type { Plan } from "@/app/generated/prisma/client";
import { isBillingEnabled, PLAN_ORDER, PLANS } from "@/lib/billing/plans";
import { getPlanPriceLabels } from "@/lib/billing/prices";

export const metadata: Metadata = {
  title: "Planos e preços | AnyChat",
  description:
    "Planos do AnyChat com preço fixo por mês: Grátis, Pro e Agência. Sem cobrança por contato.",
  alternates: { canonical: "/pricing" },
};

const numberFormat = new Intl.NumberFormat("pt-BR");

const PLAN_COPY: Record<Plan, { tagline: string; cta: string }> = {
  FREE: {
    tagline: "Para testar com um perfil e começar a captar leads.",
    cta: "Começar grátis",
  },
  PRO: {
    tagline: "Para criadores e lojas que vendem pelo direct todo dia.",
    cta: "Assinar o Pro",
  },
  AGENCY: {
    tagline: "Para agências e social medias que cuidam de vários clientes.",
    cta: "Assinar o Agência",
  },
};

const INCLUDED = [
  "Comentário → DM automática por palavra-chave",
  "Resposta pública no comentário",
  "Links rastreados e relatórios",
  "Contatos e tags",
  "Equipe no mesmo workspace",
];

export default async function PricingPage() {
  // Billing is configured per deployment at runtime; never prerender it.
  await connection();
  const billingEnabled = isBillingEnabled();
  const priceLabels = billingEnabled ? await getPlanPriceLabels() : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-bold text-foreground">
            AnyChat
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-muted transition hover:text-foreground"
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-sm font-semibold uppercase text-accent">Planos e preços</p>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">
          Preço fixo por mês. Nunca por contato.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
          Você escolhe um plano pelo número de perfis do Instagram e de DMs por
          mês. Sua lista de contatos pode crescer à vontade: o preço não muda.
        </p>

        {!billingEnabled ? (
          <div className="mt-10 rounded border border-success/20 bg-success/10 p-6">
            <h2 className="text-lg font-semibold text-success">
              Esta instalação é auto-hospedada e ilimitada
            </h2>
            <p className="mt-2 text-sm leading-7 text-foreground">
              Cobrança desativada neste servidor: todas as contas do Instagram e
              DMs são ilimitadas. Valem apenas os limites de envio da própria Meta.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Entrar
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {PLAN_ORDER.map((id) => {
                const plan = PLANS[id];
                const highlighted = id === "PRO";
                const price =
                  id === "FREE" ? "R$ 0" : priceLabels?.[id] ?? "Consulte";
                return (
                  <div
                    key={id}
                    className={`flex flex-col rounded border p-6 ${
                      highlighted ? "border-accent" : "border-border"
                    }`}
                  >
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                    <p className="mt-2 text-sm text-muted">{PLAN_COPY[id].tagline}</p>
                    <p className="mt-6 text-3xl font-black">{price}</p>
                    <ul className="mt-6 flex-1 space-y-2 text-sm">
                      <li>
                        <strong>{plan.limits.maxInstagramAccounts}</strong>{" "}
                        {plan.limits.maxInstagramAccounts === 1
                          ? "conta do Instagram"
                          : "contas do Instagram"}
                      </li>
                      <li>
                        <strong>{numberFormat.format(plan.limits.maxDMsPerMonth)}</strong>{" "}
                        DMs por mês
                      </li>
                      <li>Contatos ilimitados</li>
                    </ul>
                    <Link
                      href="/login"
                      className={`mt-8 inline-flex justify-center rounded px-5 py-2.5 text-sm font-semibold transition-colors ${
                        highlighted
                          ? "bg-accent text-white hover:bg-accent-hover"
                          : "border border-border hover:border-border-hover"
                      }`}
                    >
                      {PLAN_COPY[id].cta}
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold">Incluído em todos os planos</h2>
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {INCLUDED.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 text-sm leading-7 text-muted">
                <h2 className="text-lg font-semibold text-foreground">Como funciona a cobrança</h2>
                <p>
                  Assinatura mensal em reais, paga com cartão de crédito pelo
                  Stripe. Você troca de plano ou cancela quando quiser em
                  Configurações → Plano e cobrança.
                </p>
                <p>
                  Ao atingir o limite de DMs do mês, novas DMs deixam de ser
                  enviadas (ficam registradas como “limite do plano”) até o
                  início do mês seguinte ou até você mudar de plano. Se um pagamento
                  falhar, a conta passa a usar os limites do plano Grátis até a
                  regularização.
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

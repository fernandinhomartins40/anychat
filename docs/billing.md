# Planos e cobrança (Stripe)

O AnyChat hospedado cobra um **preço fixo por plano**, nunca por contato
(princípio "preço previsível" do [PRD](PRD.md), item S2). A cobrança é
**opcional**: quem hospeda por conta própria não precisa configurar nada.

## Interruptor único

Tudo depende de uma variável: `STRIPE_SECRET_KEY`
(`isBillingEnabled()` em `lib/billing/plans.ts`).

| `STRIPE_SECRET_KEY` | Comportamento |
|---|---|
| vazia (auto-hospedado) | Todos os workspaces são ilimitados, a seção "Plano e cobrança" vira só um contador de uso e `/pricing` informa que a instância é ilimitada. As rotas `/api/billing/*` respondem 404. |
| definida (hospedado) | Limites por plano, checkout, portal do cliente e webhook ativos. |

## Planos

Os limites ficam no código (`lib/billing/plans.ts`); os preços ficam no Stripe.

| Plano | Contas do Instagram | DMs por mês |
|---|---|---|
| Grátis | 1 | 300 |
| Pro | 3 | 10.000 |
| Agência | 15 | 50.000 |

- O limite de DMs usa o contador mensal existente (`reserveWorkspaceDMSend` em
  `lib/billing/usage.ts`). O período é o **mês do calendário**; ao atingir o
  limite a DM é registrada como `SKIPPED_PLAN_LIMIT` e não é enviada.
- O limite de contas é verificado ao conectar uma conta nova (OAuth da Meta em
  `app/api/instagram/callback` e importação via Zernio). Reconectar uma conta
  que já está no workspace não conta. Contas já conectadas não são removidas se
  o plano diminuir.
- Assinatura `past_due`, `unpaid`, `paused`, `incomplete` ou `canceled` volta
  para os limites do **Grátis** até o Stripe informar `active`/`trialing`
  de novo.

## Configurar o Stripe

1. **Produtos e preços.** No painel do Stripe, crie dois produtos (Pro e
   Agência), cada um com um preço **recorrente mensal em BRL**. Copie os ids
   `price_...`.
2. **Variáveis de ambiente** (veja `.env.example`):

   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PRO=price_...
   STRIPE_PRICE_AGENCY=price_...
   # Opcional: texto exibido. Sem ele, o valor é lido do preço no Stripe.
   NEXT_PUBLIC_PRICE_PRO_LABEL="R$ XX/mês"
   NEXT_PUBLIC_PRICE_AGENCY_LABEL="R$ XXX/mês"
   ```

   As variáveis `NEXT_PUBLIC_*` são embutidas no build: mude e faça novo build.
3. **Webhook.** Em *Developers → Webhooks*, adicione o endpoint
   `https://SEU_DOMINIO/api/billing/webhook` com os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

   Copie o *signing secret* para `STRIPE_WEBHOOK_SECRET`.
4. **Portal do cliente.** Em *Settings → Billing → Customer portal*, ative o
   portal e permita: atualizar forma de pagamento, ver faturas, cancelar
   assinatura e **trocar de plano** (adicione os produtos Pro e Agência). A
   troca entre Pro e Agência de quem já assina acontece pelo portal.
5. **Teste local** com a Stripe CLI:

   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   # use o whsec_ exibido como STRIPE_WEBHOOK_SECRET
   ```

   Assine com o cartão de teste `4242 4242 4242 4242` em Configurações →
   Plano e cobrança.

## Formas de pagamento

O checkout aceita **cartão de crédito**. O Pix do Stripe não suporta
assinaturas recorrentes no Checkout, então não é oferecido. Boleto também não
está habilitado.

## Como funciona

- `POST /api/billing/checkout` (só o dono do workspace): cria o cliente no
  Stripe na primeira vez, abre uma sessão de Checkout em modo assinatura (BRL,
  cartão). Se o workspace já tem uma assinatura viva, devolve o portal.
- `POST /api/billing/portal` (só o dono): abre o portal do cliente.
- `POST /api/billing/webhook`: verifica a assinatura com
  `STRIPE_WEBHOOK_SECRET` sobre o corpo bruto, rebusca a assinatura no Stripe
  (eventos fora de ordem não regridem o estado) e grava o evento em
  `BillingEvent` para que reenvios sejam ignorados.
- `GET /api/billing`: plano, limites e uso exibidos em Configurações.

Um preço que não corresponde a `STRIPE_PRICE_PRO` nem `STRIPE_PRICE_AGENCY` é
tratado como Grátis (com aviso no log). Por isso, ao trocar o id de preço de
um plano, migre antes os assinantes do preço antigo no Stripe.

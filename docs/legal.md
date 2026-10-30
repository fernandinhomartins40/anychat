# Páginas legais e identidade da empresa

> **⚠️ Revisão jurídica obrigatória antes do lançamento público.** Os textos de
> `/terms`, `/privacy` e `/data-deletion` foram redigidos como ponto de partida
> (LGPD, Marco Civil, CDC e exigências da Meta), mas **não foram revisados por
> advogado**. Um advogado com experiência em LGPD e SaaS deve revisar e ajustar
> antes de abrir o serviço ao público ou enviar o app para o App Review. Pontos
> que merecem atenção especial estão listados no fim deste documento.

## Onde ficam

| Rota | Arquivo | Uso |
|---|---|---|
| `/terms` | `app/terms/page.tsx` | Termos de Uso (URL de termos no painel da Meta) |
| `/privacy` | `app/privacy/page.tsx` | Política de Privacidade (URL de privacidade no painel da Meta) |
| `/data-deletion` | `app/data-deletion/page.tsx` | Instruções de exclusão de dados (campo *Data Deletion Instructions URL* da Meta) |
| `/meta-review` | `app/meta-review/page.tsx` | Notas em inglês para o revisor da Meta |

O layout comum (`components/legal-shell.tsx`) mostra no rodapé de todas essas
páginas quem opera o serviço.

## Identidade da empresa (variáveis de ambiente)

Os dados da empresa operadora vêm de `lib/company.ts`, que lê:

| Variável | Conteúdo |
|---|---|
| `NEXT_PUBLIC_COMPANY_NAME` | Razão social |
| `NEXT_PUBLIC_COMPANY_CNPJ` | CNPJ (formato `00.000.000/0000-00`) |
| `NEXT_PUBLIC_COMPANY_EMAIL` | E-mail de contato e do encarregado de dados (DPO) |
| `NEXT_PUBLIC_COMPANY_ADDRESS` | Endereço da sede |

Enquanto uma variável estiver vazia, a página mostra `[preencher …]` no lugar,
de propósito, para que a falta seja percebida. Como são `NEXT_PUBLIC_*`, os
valores entram no build: **refaça o build depois de alterá-los**. Os dados
precisam bater com os da verificação de empresa na Meta (PRD, seção 8).

## Papéis na LGPD adotados nos textos

- **Dados dos clientes** (e-mail, equipe, plano, cobrança, conta de Instagram
  conectada): o AnyChat é **controlador**.
- **Dados dos seguidores** (id e @ do Instagram, comentários, DMs, contatos,
  tags, cliques): o **cliente é controlador** e o AnyChat é **operador**.

## Exclusão de dados e a Meta

A Meta aceita **ou** uma URL de instruções **ou** um *callback* de exclusão
(`signed_request`). Hoje usamos a página de instruções (`/data-deletion`).
O *callback* ainda **não está implementado**; se a Meta exigir, criar uma rota
que valide o `signed_request` com o `INSTAGRAM_APP_SECRET`, apague a conta de
Instagram correspondente (o `deleteMany` em `app/api/instagram/disconnect`
já remove em cascata automações, logs, contatos, tags e cliques) e devolva
`{ url, confirmation_code }` apontando para uma página de status.

## Pontos para o advogado revisar

- Prazos prometidos: resposta em até 15 dias e exclusão em até 30 dias.
- Retenção: registros de acesso por 6 meses (art. 15 do Marco Civil) e
  documentos fiscais; confirmar se a infraestrutura realmente guarda esses
  registros pelo prazo.
- Limitação de responsabilidade (valor pago em 12 meses) frente ao CDC.
- Direito de arrependimento (art. 49 do CDC) e regras de cancelamento, que
  devem bater com o que a cobrança (S2) implementar.
- Lista de suboperadores e transferência internacional (art. 33): nomear
  provedores se o advogado preferir (hospedagem, e-mail, pagamentos, análise
  de audiência).
- Foro e se o serviço é tratado como relação de consumo.
- Eventual necessidade de contrato de operador (DPA) separado com clientes
  agências.

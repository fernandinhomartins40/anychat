# Análise: ManyChat × OpenReply → proposta do AnyChat

> Objetivo: entender como o ManyChat funciona e onde ele é complicado, para criar
> um concorrente mais simples, partindo de um fork do OpenReply (MIT).
> Não é para copiar o ManyChat — nem código, nem textos, nem visual.

Data da análise: 30/10/2026.

---

## 1. Método (e por que não usamos o REA no ManyChat)

| Fonte | O que foi analisado |
|---|---|
| Código do OpenReply (`diwenne/openreply`, commit de 28/10/2026) | Schema Prisma, rotas, worker, filas, docs de setup |
| Central de ajuda / guias públicos do ManyChat e reviews (G2, Capterra, TrustRadius) | Gatilhos, blocos, regras da Meta, preços, reclamações |

**O REA ([morluto/rea](https://github.com/morluto/rea)) não foi usado contra o ManyChat**, por três motivos:

1. **Não revela o que importa.** O ManyChat é SaaS: motor de fluxos, filas, IA e integração
   com a Meta rodam nos servidores deles. No navegador só chega o painel (JS minificado) e
   chamadas à API interna. O REA não tem como ver o backend.
2. **Exige login e viola os termos.** O painel só abre com conta conectada ao Facebook/Instagram,
   e termos de SaaS normalmente proíbem engenharia reversa. O próprio README do REA restringe o uso
   a software que você possui ou tem autorização para examinar. Isso seria um risco jurídico
   desnecessário para um produto comercial.
3. **Não é necessário.** Tudo que o ManyChat faz no Instagram passa pela **API pública da Meta**.
   As capacidades e limites são os mesmos para qualquer um, e o comportamento do ManyChat está
   documentado publicamente. A análise de produto (o que ele faz e onde confunde) é o que
   realmente ajuda a criar algo melhor.

Para ver telas e fluxos com os próprios olhos, o caminho legítimo é criar uma conta gratuita e
usar o ManyChat como cliente, anotando o que confunde.

---

## 2. Como o ManyChat funciona

### 2.1 Modelo mental
```
Canal (IG, Messenger, WhatsApp, TikTok, SMS, e-mail)
  └─ Gatilho (comentário, DM com palavra, resposta a story, menção, live, anúncio, link ref…)
       └─ Fluxo (grafo de nós no Flow Builder)
            ├─ Mensagem (texto, imagem, botões, respostas rápidas)
            ├─ Ação (tag, campo personalizado, webhook, notificar equipe)
            ├─ Condição (tem tag? campo = X? clicou?)
            ├─ Smart Delay (esperar)
            ├─ Randomizer (A/B, distribuir entre atendentes)
            ├─ User Input (perguntar e salvar resposta: e-mail, telefone…)
            └─ Etapa de IA (responder/entender intenção — add-on pago)
Contato (CRM): tags, campos personalizados, sequências, histórico
```

### 2.2 Gatilhos no Instagram
- Comentário em post/Reel: um post, todos ou o **próximo** post; palavras incluídas/excluídas ou qualquer comentário; respostas públicas que alternam aleatoriamente.
- Palavra-chave em DM.
- Resposta/reação a story (não dispara com curtida).
- Menção em story, comentário em Live (só durante a transmissão), anúncios, links de referência, compartilhamento para DM, "Follow to DM" (beta).

### 2.3 Regras da Meta que valem para todos (inclusive para nós)
- Conta precisa ser **Business ou Creator**.
- **Uma resposta privada por comentário**, em até 7 dias. Enviar essa resposta **não abre** a janela de 24h: a pessoa precisa responder ou tocar num botão.
- Mensagens automáticas só dentro de **24h** da última interação do usuário; atendimento humano tem janela de 7 dias.
- Limite de ~**750 respostas privadas/hora** por conta; volume alto ou respostas idênticas podem gerar restrição.
- Conectar contas de terceiros exige **App Review + verificação de empresa** na Meta.

### 2.4 Preço (março/2026 em diante, segundo fontes secundárias — conferir em manychat.com/pricing)
- Planos por **contatos ativos**: Free (25 contatos), Essential, Pro, Business, Advanced.
- Pro a partir de ~US$ 15–39/mês conforme a faixa de contatos; IA como add-on (~US$ 29/mês em várias fontes).
- WhatsApp: a Meta cobra conversas à parte.
- Um post viral pode estourar a faixa de contatos e a conta.

---

## 3. Onde o ManyChat é complicado (oportunidades)

| Dor | Evidência | Oportunidade para o AnyChat |
|---|---|---|
| Flow Builder (grafo de nós) até para tarefas de uma frase | Reviews: "ainda complicado de entender"; um usuário do G2 levou "cerca de um ano" para se sentir confortável | Assistente por **objetivo** ("entregar um link a quem comentar X") que gera a automação; editor de fluxo só quando necessário |
| Vocabulário de marketing: contatos ativos, campos, tags, sequências, growth tools | ReplyRush, Capterra | Linguagem simples; conceitos aparecem só quando usados |
| Falha silenciosa: nó desconectado ou regra da Meta faz a automação "morrer" sem aviso | Reclamações de automações paradas por semanas | **Validação antes de publicar**, simulador de conversa e alertas ativos ("sua campanha X não enviou nada em 48h") |
| Regras da Meta pouco visíveis (janela de 24h, 1 resposta por comentário) | Ajuda do ManyChat | Editor que **impede** montar algo que a Meta vai bloquear e explica o porquê |
| Três formas de conectar o Instagram, com recursos diferentes | Ajuda do ManyChat | Um só caminho recomendado, com checklist automático |
| Preço imprevisível por contato | Várias análises de preço | Self-host gratuito; se houver versão hospedada, preço fixo |
| Suporte basicamente via fórum | ReplyRush | Diagnóstico embutido que diz o que fazer |

---

## 4. O que o OpenReply já tem (lido no código)

Stack: Next.js 16, React 19, Prisma 7 + PostgreSQL, BullMQ + Redis (worker separado), Auth.js com magic link, Tailwind.

| Recurso | Onde está |
|---|---|
| Comentário → DM por palavra-chave (palavra inteira/parcial, qualquer palavra, qualquer post, **próximo Reel**) | `Automation` no schema, `lib/automation/attach-next-reel.ts` |
| Resposta pública com variações | `publicReplyMessages` |
| DM de abertura com botão (abre a janela de 24h) e mensagem revelada ao tocar | `openingDm*`, postbacks em `lib/queue/process-webhook.ts` |
| Exigir seguir antes do link | `requireFollow`, `followPrompt*` |
| Mensagem de acompanhamento com atraso | `followUpEnabled`, `followUpDelayMinutes` |
| Gatilho por DM / resposta a story | `dmTriggerEnabled` |
| Links rastreados (2 botões) e cliques | `TrackedLink`, `LinkClick`, `app/r/[slug]` |
| Inbox, logs, relatórios compartilháveis, histórico de seguidores | `app/(dashboard)/inbox`, `DmLog`, `reports/`, `FollowerSnapshot` |
| Reconciliação por polling (recupera comentários perdidos pelo webhook) | `lib/polling/comment-reconciler.ts` |
| Workspaces, papéis, convites, várias contas IG | `Workspace*`, `InstagramAccount` |
| API e MCP só de leitura | `app/api/v1`, `app/api/mcp` |
| Diagnóstico e saúde do worker | `app/(dashboard)/diagnostics`, `lib/ops/worker-health.ts` |
| Português do Brasil | `lib/i18n/pt-BR.json` |

**Ponto fraco do OpenReply: instalar.** O `docs/setup.md` tem 9 passos e ~390 linhas: Railway (Postgres, Redis, worker) + Vercel + Resend + app na Meta com 3 segredos, testers, redirect OAuth, webhook e publicação. São ~10 variáveis de ambiente obrigatórias e **3 serviços** além da Meta.

---

## 5. Lacunas: ManyChat × OpenReply

| Recurso | ManyChat | OpenReply | Prioridade AnyChat |
|---|---|---|---|
| Comentário → DM, story, DM por palavra | ✅ | ✅ | já existe |
| Menção em story, comentário em Live | ✅ | ❌ | **Alta** (mesma API de webhooks) |
| Mensagem padrão / boas-vindas na primeira DM | ✅ | ❌ | **Alta** |
| Fluxos com várias etapas, botões que ramificam, condições | ✅ | ❌ (fluxo fixo) | **Alta** — mas com editor simples |
| Coletar dados (e-mail, telefone) na conversa | ✅ | ❌ | **Alta** |
| CRM: contatos, tags, campos | ✅ | ❌ (só logs) | **Alta** |
| Webhook de saída / Google Sheets / Zapier / Make | ✅ | ❌ | **Alta** (webhook resolve 80%) |
| Respostas com IA (FAQ, intenção) | ✅ (add-on pago) | ❌ | Média — diferencial se for nativo |
| Envios em massa e sequências (respeitando 24h) | ✅ | ❌ | Média |
| A/B (randomizer) | ✅ | ❌ | Média |
| Atribuição de conversa a atendente, notas | ✅ | parcial (inbox) | Média |
| Messenger, WhatsApp | ✅ | ❌ | Baixa no início (WhatsApp é o maior esforço) |
| TikTok, SMS, e-mail, pagamentos, app mobile | ✅ | ❌ | Baixa |

---

## 6. Proposta: o que faz o AnyChat ser melhor (não uma cópia)

### Princípios
1. **Objetivo primeiro, fluxo depois.** O usuário escolhe "o que quero que aconteça" (entregar link, capturar e-mail, responder dúvidas, qualificar lead) e o sistema monta a automação. O fluxo gerado pode ser aberto num editor **linear** (lista de passos com ramificações simples), não num grafo livre.
2. **Impossível publicar algo quebrado.** Validação antes de publicar: passo sem saída, botão sem destino, mensagem fora da janela de 24h, palavra-chave usada em duas campanhas.
3. **Simulador.** Testar a conversa no próprio painel, como se fosse o seguidor, antes de ligar.
4. **Alertas ativos.** Token expirando, webhook sem eventos, campanha sem envios, restrição da Meta — com o que fazer, em português.
5. **Regras da Meta embutidas.** O editor explica limites no momento certo, em vez de deixar falhar.
6. **IA como ajudante de configuração** (não só no chat): "descreva sua automação" → rascunho pronto; sugere palavras-chave e textos.

### Instalação muito mais simples (maior vantagem sobre o OpenReply)
- **Um container, um banco:** trocar BullMQ/Redis por fila no Postgres (ex.: pg-boss ou `SELECT … FOR UPDATE SKIP LOCKED`) e rodar web + worker no mesmo processo. Fica: 1 imagem Docker + PostgreSQL.
- **Assistente de primeira execução** no próprio app: gera `NEXTAUTH_SECRET`/`ENCRYPTION_KEY` sozinho, testa o e-mail, mostra a URL do webhook e o token prontos para colar, e verifica cada passo da Meta com ✅/❌.
- **Login sem depender de serviço de e-mail** na instalação inicial (senha do admin), com magic link opcional.
- Deploy em 1 clique (Railway / Render / Coolify / Dokploy) e `docker compose up` local.

---

## 7. Roadmap sugerido

| Fase | Entregas |
|---|---|
| **0. Fork e base** | Fork do OpenReply mantendo o aviso de copyright MIT; renomear para AnyChat; manter pt-BR como idioma principal |
| **1. Instalação simples** | Fila no Postgres (remover Redis), processo único, assistente de primeira execução, checklist da Meta com verificação automática |
| **2. CRM mínimo** | Contatos (criados a cada interação), tags, campos; exportar CSV; webhook de saída |
| **3. Fluxos simples** | Modelo de dados de fluxo (passos + ramificações por botão/condição), coleta de e-mail/telefone, editor linear, validação e simulador |
| **4. Novos gatilhos** | Menção em story, Live, mensagem de boas-vindas/padrão |
| **5. IA** | Respostas de FAQ com base de conhecimento, assistente que cria automações a partir de uma descrição |
| **6. Crescimento** | Envios em massa/sequências dentro das regras da Meta, A/B, atribuição de conversas, Messenger; WhatsApp depois |

---

## Fontes
- OpenReply: https://github.com/diwenne/openreply
- REA: https://github.com/morluto/rea
- Guia ManyChat para Instagram (getkanal): https://getkanal.com/blog/manychat-instagram
- ManyChat EDU (blocos): https://manychatedu.teachable.com/courses/2668484/lectures/57957011
- Reclamações de complexidade (ReplyRush, concorrente): https://www.replyrush.com/post/manychat-too-complicated-simpler-alternative
- Reviews: https://www.capterra.com/p/206636/ManyChat/reviews/ · https://www.g2.com/products/manychat/reviews_and_filters · https://www.trustradius.com/products/manychat
- Preços 2026: https://www.eesel.ai/blog/manychat-pricing · https://www.featurebase.app/blog/manychat-pricing
- Custos de self-host do OpenReply: https://creatorflow.so/blog/open-source-instagram-dm-automation/

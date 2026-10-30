<div align="center">

# AnyChat

Automação de Instagram simples de verdade: comentou a palavra, recebeu a DM.
Um concorrente do ManyChat feito para quem não quer aprender um editor de fluxos.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)

</div>

## O que é

AnyChat responde automaticamente comentários e DMs no Instagram pela **API oficial da Meta**
(nunca pede senha, não faz scraping). Quem comenta uma palavra-chave recebe uma DM com seu link,
e cada pessoa que interage vira um **contato** com **tags**, que você filtra e exporta.

O produto principal é a versão **hospedada**: a empresa operadora passa uma vez pela revisão da Meta
e os clientes só clicam em "Conectar Instagram". O código continua aberto (MIT) para quem quiser
hospedar por conta própria.

- Plano do produto: [docs/PRD.md](docs/PRD.md)
- Por que e como: [docs/analise-manychat-vs-openreply.md](docs/analise-manychat-vs-openreply.md)

## Recursos

| Recurso | Estado |
|---|---|
| Comentário com palavra-chave → DM (um post, todos ou o próximo Reel) | ✅ |
| Resposta pública com variações, DM de abertura com botão, exigir seguir, mensagem de acompanhamento | ✅ |
| Gatilho por DM e resposta a Story | ✅ |
| Links rastreados com cliques e CTR, relatórios compartilháveis | ✅ |
| **Contatos**: criados a cada comentário/DM, tags manuais e automáticas por campanha, busca, filtro, exportar CSV | ✅ novo |
| Caixa de entrada, logs de envio, diagnóstico, várias contas e equipe | ✅ |
| Português do Brasil como idioma padrão | ✅ novo |
| Alertas ativos, checklist de conexão, boas-vindas, conversas em etapas, IA | 🔜 ver [PRD](docs/PRD.md) |

## Rodar localmente

```bash
docker compose up -d          # Postgres e Redis
cp .env.example .env          # preencha os segredos
npm ci
npm run db:generate && npm run db:migrate
npm run dev                   # painel em http://localhost:3000
npm run worker                # outro terminal: processa e envia as DMs
```

Configuração completa (app na Meta, webhook, deploy): [docs/setup.md](docs/setup.md).

## Testes

```bash
npm test                      # unitários
npm run typecheck && npm run lint
# Integração com Postgres real (opcional):
TEST_DATABASE_URL=postgresql://... npx vitest run __tests__/contacts.db.test.ts
```

## Créditos

AnyChat é um fork do [OpenReply](https://github.com/diwenne/openreply) de Diwen Huang, que por sua vez
deriva do trabalho de Anish Raj — ambos sob licença MIT (veja [LICENSE](LICENSE)). O README original
está em [docs/openreply-README.md](docs/openreply-README.md). O histórico do upstream foi preservado
(`git remote add upstream https://github.com/diwenne/openreply.git`) para trazer correções futuras.

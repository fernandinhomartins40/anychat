# PRD — AnyChat

**Versão:** 0.1 · **Data:** 30/10/2026 · **Base técnica:** fork do OpenReply (MIT)
**Documento de apoio:** [análise ManyChat × OpenReply](analise-manychat-vs-openreply.md)

---

## 1. Resumo

AnyChat é uma plataforma **hospedada (SaaS)** de automação de Instagram — e depois de outros
canais da Meta — que entrega o que o ManyChat entrega para pequenos negócios e criadores, mas
**sem a complexidade**: o usuário diz o que quer que aconteça, o AnyChat monta a automação,
testa antes de publicar e avisa quando algo para de funcionar.

O código continua aberto (MIT, como o OpenReply), mas o produto principal é a versão
hospedada: a empresa por trás do AnyChat passa **uma vez** pela revisão da Meta
(App Review + verificação de empresa), e os clientes só clicam em **"Conectar Instagram"**.

## 2. Problema

| Quem | Dor |
|---|---|
| Criadores e pequenos negócios | O ManyChat exige aprender um editor de fluxos em grafo, vocabulário de marketing (contatos ativos, campos, sequências) e regras da Meta escondidas. Automações quebram em silêncio. |
| Quem tenta alternativas abertas (OpenReply) | Precisa criar o próprio app na Meta, configurar 3 serviços, ~10 segredos e passar pela revisão — inviável para não técnicos. |
| Todos | Preço do ManyChat por contato ativo: um post viral estoura a conta. |

## 3. Objetivos e métricas

| Objetivo | Métrica | Meta (lançamento) |
|---|---|---|
| Primeira automação rápida | Tempo do cadastro até a 1ª DM enviada | **< 5 minutos** |
| Zero falha silenciosa | % de automações paradas sem alerta ao usuário | **0%** |
| Entendível sem tutorial | % de usuários que publicam 1 automação sem abrir ajuda | > 70% |
| Retenção | Contas com automação ativa após 30 dias | > 50% |
| Conformidade | Contas restringidas pela Meta por uso do AnyChat | ~0 |

**Não objetivos (v1):** competir com ManyChat em e-commerce, pagamentos, SMS, e-mail marketing
ou TikTok; app mobile nativo; automação fora das APIs oficiais da Meta (nunca pedimos senha).

## 4. Público

1. **Criador de conteúdo** — entrega materiais/links a quem comenta uma palavra.
2. **Pequeno negócio local/infoprodutor** — responde preço/horário, captura WhatsApp/e-mail de leads.
3. **Agência** — gerencia várias contas de clientes, precisa de relatórios.

## 5. Princípios de produto

1. **Objetivo primeiro, fluxo depois.** Começa por "o que você quer?", não por um canvas vazio.
2. **Impossível publicar quebrado.** Validação antes de ativar.
3. **Regras da Meta dentro do produto**, explicadas no momento certo e em português simples.
4. **Alertas ativos** quando algo para (token, webhook, campanha sem envios, restrição).
5. **Preço previsível** (por plano, não por contato ativo).
6. **Só API oficial.** Nada de senha, scraping ou automação de navegador.

## 6. Requisitos funcionais

Prioridade: **P0** = lançamento, **P1** = logo após, **P2** = depois.

### 6.1 Conta e conexão
| ID | Requisito | Prio | Estado |
|---|---|---|---|
| C1 | Cadastro com link mágico por e-mail | P0 | herdado |
| C2 | Conectar Instagram em 1 clique (Instagram Login, app aprovado do AnyChat) | P0 | herdado (precisa App Review) |
| C3 | Workspaces, papéis, convites, várias contas IG | P0 | herdado |
| C4 | Checklist de conexão: conta Business/Creator, permissões, webhook recebendo, controle de conversas (migração do ManyChat) | P0 | novo |
| C5 | Renovação automática de token + alerta se falhar | P0 | herdado (alerta novo) |

### 6.2 Automações (gatilhos)
| ID | Requisito | Prio | Estado |
|---|---|---|---|
| A1 | Comentário com palavra-chave → DM (um post, todos, próximo Reel) | P0 | herdado |
| A2 | Resposta pública com variações | P0 | herdado |
| A3 | DM com palavra-chave / resposta a Story | P0 | herdado |
| A4 | DM de abertura com botão, exigir seguir, mensagem de acompanhamento | P0 | herdado |
| A5 | Mensagem de boas-vindas (primeira DM) e resposta padrão | P1 | novo |
| A6 | Menção em Story | P1 | novo |
| A7 | Comentário em Live | P2 | novo |
| A8 | Criação por objetivo (assistente) e por descrição em linguagem natural (IA) | P1 | novo |

### 6.3 Contatos (CRM simples)
| ID | Requisito | Prio | Estado |
|---|---|---|---|
| K1 | Contato criado/atualizado automaticamente a cada interação (comentário, DM, clique em botão) | P0 | **implementado nesta fase** |
| K2 | Tags: manuais e aplicadas automaticamente pela campanha | P0 | **implementado nesta fase** |
| K3 | Lista de contatos com busca e filtro por tag; exportar CSV | P0 | **implementado nesta fase** |
| K4 | Campos (e-mail, telefone) coletados na conversa | P1 | novo |
| K5 | Webhook de saída (novo contato, tag aplicada, dado coletado) | P1 | novo |

### 6.4 Conversas com etapas
| ID | Requisito | Prio | Estado |
|---|---|---|---|
| F1 | Passos lineares com botões que levam a outros passos | P1 | novo |
| F2 | Pergunta com validação (e-mail, telefone, texto) que salva no contato | P1 | novo |
| F3 | Validação antes de publicar e simulador de conversa | P1 | novo |
| F4 | A/B de mensagens | P2 | novo |

### 6.5 Confiabilidade e alertas
| ID | Requisito | Prio | Estado |
|---|---|---|---|
| R1 | Logs de cada envio com motivo, reconciliação de comentários perdidos | P0 | herdado |
| R2 | Alertas: campanha ativa sem envios em 48h com comentários recebidos, token expirando, webhook mudo, worker parado | P0 | novo |
| R3 | Painel de diagnóstico em linguagem simples | P0 | herdado (reescrever textos) |

### 6.6 Inbox e equipe
| ID | Requisito | Prio | Estado |
|---|---|---|---|
| I1 | Inbox com resposta dentro da janela da Meta | P0 | herdado |
| I2 | Ver tags/dados do contato ao lado da conversa | P1 | novo |
| I3 | Atribuir conversa a membro da equipe | P2 | novo |

### 6.7 IA
| ID | Requisito | Prio |
|---|---|---|
| IA1 | Respostas automáticas de FAQ com base de conhecimento do negócio | P1 |
| IA2 | Assistente que cria/edita automações a partir de descrição | P1 |

### 6.8 Canais
| ID | Requisito | Prio |
|---|---|---|
| M1 | Facebook Messenger | P2 |
| M2 | WhatsApp Cloud API (cobrança da Meta por mensagem repassada) | P2 |

### 6.9 SaaS
| ID | Requisito | Prio |
|---|---|---|
| S1 | Marca AnyChat, português do Brasil como idioma padrão; landing page nova para o SaaS | P0 (**marca e idioma feitos; landing pendente**) |
| S2 | Planos com preço fixo e limites por conta IG / DMs por mês; cobrança (Stripe/Mercado Pago) | P0 |
| S3 | Páginas legais (termos, privacidade, exclusão de dados) da empresa operadora | P0 |
| S4 | Self-host continua possível (docs), com fila no Postgres para dispensar Redis | P2 |

## 7. Requisitos não funcionais
- Respeitar limites da Meta: ~750 respostas privadas/hora por conta, 1 resposta privada por comentário, janela de 24h.
- Dados de contatos tratados conforme **LGPD**: exclusão por pedido (endpoint de data deletion já existe), exportação, mínimo necessário.
- Tokens criptografados em repouso (herdado).
- Webhook responde rápido e processa em fila (herdado).

## 8. Plano de aprovação na Meta (operador: sua empresa)
1. **Empresa:** CNPJ ativo, domínio próprio (ex.: anychat.com.br), e-mail no domínio, páginas de privacidade/termos/exclusão de dados publicadas.
2. **Meta Business:** criar portfólio empresarial e concluir a **verificação de empresa** (documento do CNPJ, comprovante de endereço/telefone).
3. **App na Meta** (tipo Business) com o produto *Instagram API with Instagram Login*; OAuth redirect e webhook apontando para o domínio de produção.
4. **App Review — Advanced Access** para: `instagram_business_basic`, `instagram_business_manage_comments`, `instagram_business_manage_messages`. Para cada permissão: justificativa (rascunhos em `META_APP_REVIEW.md`) + vídeo único mostrando login → conexão → criação de campanha → comentário real → DM recebida.
5. **Esperar recusa na primeira tentativa** e reenviar ajustando o que o revisor apontar.
6. Enquanto não aprova: funciona para contas adicionadas como testadoras do app (beta fechado).

## 9. Fases
| Fase | Escopo | Saída |
|---|---|---|
| **1 (agora)** | Fork, marca, pt-BR padrão, CRM mínimo (K1–K3) | Base do produto |
| 2 | Alertas (R2), checklist de conexão (C4), boas-vindas/resposta padrão (A5) | Beta fechado com testadores |
| 3 | Planos e cobrança (S2), páginas legais (S3), App Review | Lançamento público |
| 4 | Conversas com etapas e coleta de dados (F1–F3, K4), webhook de saída (K5) | Paridade útil com ManyChat |
| 5 | IA (IA1–IA2), menção em Story (A6) | Diferencial |
| 6 | Messenger, WhatsApp, A/B, atribuição | Expansão |

## 10. Riscos
| Risco | Mitigação |
|---|---|
| Meta recusa o App Review | Seguir o roteiro da seção 8; beta com testadores enquanto isso |
| Meta muda API/limites | Camada `lib/instagram/provider.ts` isola chamadas; acompanhar changelog da Graph API |
| Conta de cliente restringida | Limites conservadores, variações de resposta, avisos no editor |
| Divergir demais do upstream | Remote `upstream` mantido; mudanças isoladas em módulos novos |

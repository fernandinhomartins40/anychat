# AnyChat — Design system "Aurora" e fluxos em 3 passos

Objetivo: qualquer pessoa leiga faz qualquer tarefa em **no máximo 3 passos**, numa interface
colorida, amigável e visivelmente diferente do OpenReply/ManyChat.

## 1. Princípios (com base em pesquisa)

| # | Regra | De onde vem | Como aplicar |
|---|---|---|---|
| 1 | **Regra dos 3 passos** | Tempo até o primeiro valor é o que mais derruba abandono em SaaS | Toda tarefa: *escolher → ajustar → confirmar*. Se passar de 3, quebrar ou esconder o opcional |
| 2 | **Uma ação principal por tela** | Lei de Hick (menos escolhas = decisão mais rápida) | Só um botão em gradiente (`variant="primary"`) por tela; o resto é `secondary`/`ghost` |
| 3 | **Revelação progressiva** | NN/g, progressive disclosure | Opções avançadas fechadas em "Mais opções" / acordeão; padrão sensato sempre preenchido |
| 4 | **Começar pelo objetivo, não pela ferramenta** | Análise ManyChat (docs/analise-manychat-vs-openreply.md) | Criar automação começa por cards de objetivo ("Entregar um link", "Responder preço"...) |
| 5 | **Estados vazios que ensinam** | NN/g: estado vazio mostra status, ensina e oferece a próxima ação | Sempre `EmptyState` com ícone, 1 frase e 1 botão |
| 6 | **Linguagem de gente** | Público leigo | "Quem comentar", "mensagem", "palavra" — nunca "trigger", "payload", "webhook" na UI principal (pode em Diagnóstico/API) |
| 7 | **Feedback imediato** | Heurística de Nielsen #1 (visibilidade do status) | Toasts/inline após salvar; prévia do celular ao vivo; status com cor **e** palavra |
| 8 | **Alvos de toque ≥ 44px** | WCAG 2.2 (2.5.8 mínimo 24px; 44px iOS / 48dp Android) | Botões `min-h-11`; itens de menu `min-h-11`; barra inferior no celular |
| 9 | **Contraste AA** | WCAG: 4.5:1 texto normal, 3:1 texto grande/ícones | Texto só em `foreground`, `muted`, `accent`, `success`, `error`, `warning`. Cores vivas (sun, mint, sky, pink) só em fundos/ícones |
| 10 | **Mobile primeiro** | Público usa o Instagram no celular | Barra inferior com 4 destinos + botão "+"; nada de rolagem horizontal; tabelas viram cards no celular |
| 11 | **Reconhecer em vez de lembrar** | Heurística de Nielsen #6 | Cada área tem cor e ícone fixos (abaixo); exemplos prontos nos campos |
| 12 | **Prevenir erro** | Heurística de Nielsen #5 | Validar antes de publicar; desabilitar "Ativar" com o motivo escrito ao lado |

## 2. Identidade

- **Nome:** AnyChat · **Logo:** `components/ui/logo.tsx` (balão com brilho em gradiente).
- **Fonte:** Plus Jakarta Sans (OFL, servida de `/public/fonts`). Títulos `font-extrabold tracking-tight`; corpo `font-medium`/normal.
- **Gradiente "Aurora":** violeta `#7c3aed` → rosa `#db2777` → sol `#f59e0b`. Classes: `.bg-aurora`, `.text-aurora`, `.bg-aurora-soft` (fundo suave para heróis/onboarding).
- **Tokens** (`app/globals.css`, usar via Tailwind: `bg-violet-soft`, `text-pink` etc.):

| Token | Valor | Uso |
|---|---|---|
| background | `#f6f4ff` | fundo da página (lavanda clarinho) |
| surface | `#ffffff` | cards (`.panel`: borda + raio 20px + sombra suave) |
| foreground / muted | `#1b1530` / `#625a80` | texto |
| accent | `#7c3aed` | links, foco, item ativo |
| violet/pink/sun/mint/sky (+ `-soft`) | ver CSS | cor por área, ícones, chips |
| success / warning / error | `#047857` / `#b45309` / `#c81e1e` | estados (sempre com texto) |

- **Cor por área** (ícone `lucide-react` + `IconTile`):

| Área | Rota | Ícone | Tom |
|---|---|---|---|
| Início | /dashboard | House | violet |
| Automações | /campaigns | Zap | pink |
| Respostas automáticas | /auto-replies | Bot | sun |
| Conversas | /inbox | MessageCircle | sky |
| Contatos | /contacts | Users | mint |
| Resultados | /overview | BarChart3 | violet |
| Mais: Logs, Diagnóstico, API, Configurações | — | ListChecks, Stethoscope, Code2, Settings | violet |

- **Forma:** cards raio 20px (`.panel`), botões em pílula (`rounded-full`), campos `rounded-xl` com `min-h-11`.
- **Movimento:** só `.animate-fade-in` (220ms) em entradas; respeita `prefers-reduced-motion`.

## 3. Componentes (`components/ui/`)

| Componente | Para quê |
|---|---|
| `Button` / `ButtonLink` / `buttonClasses()` | variantes `primary` (gradiente, 1 por tela), `secondary`, `ghost`, `danger`; tamanhos `md` (44px) e `lg` |
| `PageHeader` | ícone colorido + título + 1 frase + ação principal |
| `IconTile` | quadrado colorido com ícone (tons acima) |
| `EmptyState` | ícone, título, frase, 1 ação |
| `Stepper` | progresso de fluxos de 3 passos (volta permitida, pulo não) |
| `Logo` | marca |
| `StatCard` (`components/stat-card.tsx`) | número grande + rótulo + ícone opcional |
| `StatusBadge` | pílula de status com cor e palavra |

Navegação: `components/sidebar.tsx` (desktop/gaveta, com botão "Nova automação") e
`components/mobile-nav.tsx` (barra inferior no celular).

## 4. Mapa de tarefas → 3 passos

| Tarefa | Passo 1 | Passo 2 | Passo 3 |
|---|---|---|---|
| **Criar automação** | Escolher objetivo (cards com modelos prontos) | Onde e qual palavra (post/Reel ou qualquer post + palavra) | Mensagem + link, ver prévia e **Ativar** |
| Conectar Instagram | Clicar "Conectar Instagram" | Autorizar na Meta | Ver checklist verde |
| Pausar/ativar automação | Automações | Interruptor no card | — |
| Editar automação | Automações | Abrir card | Mesmo assistente, já preenchido, salvar |
| Boas-vindas / resposta padrão | Respostas automáticas | Ligar + escrever | Salvar |
| Responder conversa | Conversas | Abrir conversa | Escrever e enviar |
| Exportar contatos | Contatos | Filtrar (opcional) | Exportar |
| Marcar contato com tag | Contatos | "+ tag" no contato | Enter |
| Ver resultados | Resultados | Escolher período/conta | — |
| Resolver alerta | Aviso no topo | "Resolver" | Ação indicada |
| Mudar de plano | Configurações → Plano | Escolher plano | Pagar (Stripe) |
| Convidar equipe | Configurações → Equipe | E-mail + papel | Enviar convite |

**Primeiro uso (Início):** cartão de boas-vindas com checklist de 3 itens —
(1) Conectar Instagram, (2) Criar a primeira automação, (3) Fazer um teste comentando de outra conta —
cada item com seu botão. Some quando os 3 estiverem feitos.

## 5. Checklist de revisão de cada tela
- [ ] Título + 1 frase dizendo para que serve (`PageHeader`)
- [ ] Uma única ação principal em gradiente
- [ ] Estado vazio com `EmptyState`
- [ ] Funciona em 390px sem rolagem horizontal; alvos ≥ 44px
- [ ] Textos via `t()` com chaves nos 3 catálogos (pt-BR é o principal)
- [ ] Nenhum jargão técnico fora de Diagnóstico/API
- [ ] Opções avançadas recolhidas

## Fontes
- Revelação progressiva: https://userpilot.com/blog/progressive-disclosure/
- Wizards e checklists de onboarding: https://kompassify.com/blog/onboarding-wizard-guide · https://lollypop.design/blog/2026/january/wizard-ui-design/
- Tempo até o primeiro valor: https://acquaintsoft.com/blog/how-to-reduce-saas-onboarding
- Estados vazios (NN/g): https://www.nngroup.com/videos/empty-states-in-application-design-guidelines/ · https://www.patternfly.org/components/empty-state/design-guidelines
- Alvos de toque e contraste (WCAG 2.2): https://testparty.ai/blog/wcag-2-5-8-target-size-minimum-2025-guide · https://www.designsystemscollective.com/a-designers-field-guide-to-wcag-ios-and-android-rules-31ba5d01d46a

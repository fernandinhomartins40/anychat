import type { Metadata } from "next";
import "./landing.css";
import Link from "next/link";
import localFont from "next/font/local";
import { company } from "@/lib/company";

const geist = localFont({
  src: "../public/fonts/geist-latin.woff2",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AnyChat - Comentou a palavra, recebeu a DM",
  description:
    "Automação de Instagram sem editor de fluxos: quem comenta a palavra-chave no seu post ou Reel recebe sua DM na hora. API oficial da Meta, nunca pedimos sua senha.",
};

function ReplyPreview() {
  return (
    <figure
      className="or-preview"
      aria-label="Exemplo: um comentário com a palavra GUIA dispara uma DM com o link do guia"
    >
      <div className="or-preview-top">
        <span className="or-wordmark">
          AnyChat<span aria-hidden="true">↗</span>
        </span>
        <span className="or-mono">Prévia da automação</span>
      </div>
      <div className="or-preview-body">
        <div className="or-preview-heading">
          <span className="or-avatar">A</span>
          <div>
            <strong>Ateliê Domingo</strong>
            <span>@atelie.domingo · Instagram</span>
          </div>
          <span className="or-active">Ativa</span>
        </div>
        <div className="or-post">
          <span className="or-mono">Campanha: Coleção nova</span>
          <p>
            Comente GUIA aqui
            <br />e eu te mando o link.
          </p>
          <span>Palavra-chave: GUIA</span>
          <div className="or-post-lines" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="or-comment">
          <span className="or-avatar or-avatar-small">M</span>
          <div>
            <strong>maya.cria</strong>
            <p>GUIA! quero muito 😍</p>
          </div>
        </div>
        <div className="or-match">
          <span aria-hidden="true">↓</span>
          <span>
            Palavra <code>GUIA</code> encontrada
          </span>
          <span className="or-match-line" />
          <span>DM enviada</span>
        </div>
        <div className="or-message">
          <span className="or-mono">Ateliê Domingo → Maya</span>
          <p>Oi, Maya! Aqui está o link 👇</p>
          <span className="or-message-link">
            Ver a coleção nova <span aria-hidden="true">↗</span>
          </span>
        </div>
        <div className="or-delivered">
          <span aria-hidden="true">✓</span> Enviada pela API oficial do
          Instagram
        </div>
      </div>
      <figcaption>
        Conteúdo de exemplo. As palavras, a mensagem e os links são seus.
      </figcaption>
    </figure>
  );
}

const steps = [
  [
    "Conecte seu Instagram",
    "Clique em “Conectar Instagram” e autorize pela própria Meta. Funciona com contas Comercial e Criador de conteúdo. Nada de senha.",
  ],
  [
    "Escolha a palavra e a mensagem",
    "Selecione o post ou Reel, defina a palavra-chave (por exemplo, GUIA) e escreva a DM com o seu link.",
  ],
  [
    "Pronto",
    "Quem comentar a palavra recebe a DM em segundos. Você acompanha envios, cliques e contatos no painel.",
  ],
];

const differentiators = [
  [
    "Sem editor de fluxos",
    "A automação mais pedida, comentário que vira DM, fica pronta em poucos minutos, em uma tela só. Sem montar diagrama, sem curso.",
  ],
  [
    "Avisamos quando algo quebra",
    "Conexão expirada, campanha ativa que parou de enviar, comentários que não chegaram: o AnyChat mostra o problema em linguagem simples para você não descobrir pelos seguidores.",
  ],
  [
    "Regras da Meta já embutidas",
    "Uma resposta privada por comentário, janela de 24 horas e ritmo de envio respeitados automaticamente, para proteger a sua conta.",
  ],
  [
    "Preço previsível",
    "Planos mensais com limites claros. Você sabe quanto vai pagar antes de começar, sem cobrança por contato.",
  ],
];

const features = [
  [
    "Comentário → DM",
    "Em um post, em todos ou no próximo Reel que você publicar. Várias palavras-chave por campanha.",
  ],
  [
    "Resposta pública",
    "Responda o comentário no próprio post com variações de texto, para parecer natural e avisar que a DM chegou.",
  ],
  [
    "Exigir seguir",
    "Peça para a pessoa seguir o perfil antes de liberar o link. Ótimo para converter interesse em seguidores.",
  ],
  [
    "Links rastreados",
    "Botões com link na DM e contagem de cliques e taxa de clique por campanha.",
  ],
  [
    "Contatos e tags",
    "Cada pessoa que interage vira um contato, com tags automáticas por campanha. Filtre e exporte em CSV.",
  ],
  [
    "Caixa de entrada",
    "Leia as conversas e responda pelo AnyChat, dentro da janela de mensagens do Instagram.",
  ],
  [
    "Relatórios",
    "Envios, cliques e evolução de seguidores, com relatórios que você pode compartilhar com clientes.",
  ],
  [
    "Gatilho por DM e Story",
    "Além de comentários, dispare mensagens quando alguém envia uma palavra por DM ou responde seus Stories.",
  ],
];

const faqs: Array<[string, React.ReactNode]> = [
  [
    "Vocês pedem a senha do meu Instagram?",
    "Nunca. A conexão é feita pelo login oficial da Meta, que entrega ao AnyChat apenas as permissões que você autoriza. Você pode desconectar a qualquer momento nas configurações.",
  ],
  [
    "Quais contas funcionam?",
    "Contas profissionais do Instagram: Comercial ou Criador de conteúdo. Contas pessoais não têm acesso à API oficial. A troca é gratuita e feita no próprio app do Instagram.",
  ],
  [
    "Preciso saber montar fluxos de automação?",
    "Não. Você escolhe o post, a palavra e a mensagem. Se quiser algo a mais, como resposta pública, exigir seguir ou botão com link, é só marcar a opção na mesma tela.",
  ],
  [
    "A automação pode prejudicar minha conta?",
    "O AnyChat usa somente a API oficial e respeita os limites da Meta, como uma resposta privada por comentário e a janela de 24 horas. Nenhuma ferramenta controla as decisões da Meta, mas seguir as regras é a melhor forma de manter a conta saudável.",
  ],
  [
    "Quanto custa?",
    <>
      Os planos têm preço fixo mensal e limites claros de contas e mensagens.
      Veja os valores em <Link href="/pricing">Preços</Link>.
    </>,
  ],
  [
    "E os dados dos meus seguidores?",
    <>
      Usamos apenas o necessário para a automação funcionar (nome de usuário,
      comentário e mensagens) e tratamos tudo conforme a LGPD. Os detalhes
      estão na <Link href="/privacy">Política de Privacidade</Link>.
    </>,
  ],
  [
    "O AnyChat é igual às ferramentas de automação completas?",
    "Não tenta ser. Ferramentas como o ManyChat oferecem editores de fluxo para cenários complexos. O AnyChat foca no que a maioria dos perfis usa no dia a dia, comentário que vira DM, e faz isso de forma simples e confiável.",
  ],
];

export default function Home() {
  return (
    <div id="top" className={`or-landing ${geist.className}`}>
      <a className="or-skip" href="#main">
        Pular para o conteúdo
      </a>
      <header className="or-header">
        <div className="or-container or-nav">
          <a className="or-wordmark" href="#top" aria-label="AnyChat, início">
            AnyChat
          </a>
          <nav aria-label="Navegação principal">
            <a href="#como-funciona">Como funciona</a>
            <a href="#recursos">Recursos</a>
            <Link href="/pricing">Preços</Link>
            <a href="#duvidas">Dúvidas</a>
          </nav>
          <div className="or-nav-cta">
            <Link className="or-nav-signin" href="/login">
              Entrar
            </Link>
            <Link className="or-button or-button-small" href="/login">
              Começar <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </header>
      <main id="main">
        <section className="or-container or-hero">
          <div className="or-hero-copy">
            <p className="or-eyebrow">Automação de Instagram</p>
            <h1>
              Comentou a palavra,
              <br />
              <span>recebeu a DM.</span>
            </h1>
            <p className="or-lead">
              Alguém comenta a palavra-chave no seu post ou Reel e recebe sua
              mensagem com o link na hora. Sem editor de fluxos, sem senha, sem
              complicação.
            </p>
            <div className="or-actions">
              <Link className="or-button or-button-primary" href="/login">
                Criar minha automação <span aria-hidden="true">↗</span>
              </Link>
              <a className="or-text-link" href="#como-funciona">
                Ver como funciona <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="or-hero-note">
              Usa só a API oficial da Meta. Nunca pedimos a senha do seu
              Instagram.
            </p>
          </div>
          <ReplyPreview />
        </section>
        <div className="or-container or-principles">
          <span>API oficial da Meta</span>
          <span>Nunca pede senha</span>
          <span>Sem editor de fluxos</span>
          <span>Preço previsível</span>
        </div>
        <div className="or-container">
          <div className="or-sheet">
            <section id="como-funciona" className="or-section or-how">
              <div>
                <h2>Como funciona</h2>
                <p>
                  Mande o link do produto, o cupom, o e-book ou a inscrição da
                  aula. Você decide a palavra e a mensagem; o AnyChat cuida do
                  resto.
                </p>
              </div>
              <ol className="or-steps">
                {steps.map(([title, description], index) => (
                  <li key={title}>
                    <span className="or-step-number">0{index + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section id="diferenciais" className="or-section">
              <div className="or-section-intro">
                <h2>Simples de usar, difícil de quebrar</h2>
                <p>
                  Feito para quem quer resultado no Instagram, não para quem
                  quer aprender uma ferramenta nova.
                </p>
              </div>
              <div className="or-feature-grid">
                {differentiators.map(([title, description]) => (
                  <article key={title}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </section>
            <section id="seguranca" className="or-technical">
              <div>
                <h2>
                  Só a API oficial.
                  <br />
                  Sua conta em primeiro lugar.
                </h2>
                <p>
                  O AnyChat não faz scraping, não usa automação de navegador e
                  não pede senha. Tudo passa pela integração oficial da Meta,
                  que você autoriza e pode revogar quando quiser.
                </p>
              </div>
              <div className="or-runtime">
                <div>
                  <span className="or-mono">Conexão</span>
                  <strong>Login oficial da Meta</strong>
                  <span>Você escolhe as permissões e pode desconectar</span>
                </div>
                <div>
                  <span className="or-mono">Envio</span>
                  <strong>Limites da Meta respeitados</strong>
                  <span>Fila, ritmo de envio e uma resposta por comentário</span>
                </div>
                <div>
                  <span className="or-mono">Dados</span>
                  <strong>Tokens criptografados</strong>
                  <span>Tratamento conforme a LGPD</span>
                </div>
              </div>
            </section>
            <section id="recursos" className="or-section">
              <div className="or-section-intro">
                <h2>Tudo o que você precisa para vender pelo direct</h2>
              </div>
              <div className="or-feature-grid">
                {features.map(([title, description]) => (
                  <article key={title}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
              <p className="or-compare-note">
                Ferramentas de fluxo completo são ótimas para cenários
                complexos. Se o que você precisa é transformar comentário em
                DM, o AnyChat resolve com muito menos configuração.
              </p>
            </section>
            <section id="precos" className="or-section or-pricing">
              <div>
                <h2>Preço fixo, sem surpresa</h2>
                <p>
                  Escolha um plano mensal pelo número de contas do Instagram e
                  de mensagens. Sem cobrança por contato e sem taxa escondida.
                </p>
                <div className="or-actions">
                  <Link className="or-button or-button-primary" href="/pricing">
                    Ver planos e preços <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
              <ul>
                <li>
                  <span aria-hidden="true">✓</span>
                  <span>Valor mensal fixo, definido no plano</span>
                </li>
                <li>
                  <span aria-hidden="true">✓</span>
                  <span>Limites claros de contas e DMs por mês</span>
                </li>
                <li>
                  <span aria-hidden="true">✓</span>
                  <span>Seus contatos não aumentam a sua conta</span>
                </li>
              </ul>
            </section>
            <section id="duvidas" className="or-section or-faq">
              <div>
                <h2>Dúvidas frequentes</h2>
              </div>
              <div>
                {faqs.map(([question, answer]) => (
                  <details key={question}>
                    <summary>{question}</summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </div>
        <section className="or-container or-closing">
          <h2>Sua próxima venda começa num comentário</h2>
          <p>Conecte o Instagram, escolha a palavra e deixe o AnyChat responder.</p>
          <div className="or-actions">
            <Link className="or-button or-button-primary" href="/login">
              Começar agora <span aria-hidden="true">↗</span>
            </Link>
            <Link className="or-text-link" href="/pricing">
              Ver preços <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>
      <footer className="or-footer">
        <div className="or-container">
          <div className="or-footer-top">
            <div>
              <Link href="/" className="or-wordmark">
                AnyChat<span aria-hidden="true">↗</span>
              </Link>
              <p>Automação de comentários e DMs no Instagram.</p>
            </div>
            <nav aria-label="Rodapé">
              <Link href="/pricing">Preços</Link>
              <Link href="/templates">Modelos</Link>
              <Link href="/privacy">Privacidade</Link>
              <Link href="/terms">Termos de uso</Link>
              <Link href="/data-deletion">Exclusão de dados</Link>
            </nav>
          </div>
          <div className="or-footer-bottom">
            <span>
              © {company.name} · CNPJ {company.cnpj}
            </span>
            <span>
              Instagram é marca registrada da Meta. O AnyChat não é afiliado à
              Meta.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

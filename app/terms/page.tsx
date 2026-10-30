import type { Metadata } from "next";
import Link from "next/link";
import LegalShell, { LegalList, LegalSection } from "@/components/legal-shell";
import CompanyEmailLink from "@/components/company-email-link";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Termos de Uso - AnyChat",
  description:
    "Condições para usar o AnyChat, serviço de automação de comentários e DMs no Instagram.",
};

const linkClass = "text-accent underline underline-offset-2";

export default function TermsPage() {
  return (
    <LegalShell
      title="Termos de Uso"
      description="Estes termos regulam o uso do AnyChat, serviço hospedado de automação de comentários e mensagens diretas no Instagram. Ao criar uma conta ou usar o serviço, você concorda com eles."
      updatedAt="30 de outubro de 2026"
    >
      <LegalSection title="1. Quem presta o serviço">
        <p>
          O AnyChat é operado por {company.name}, CNPJ {company.cnpj}, com sede
          em {company.address}. Dúvidas sobre estes termos: <CompanyEmailLink />.
        </p>
      </LegalSection>

      <LegalSection title="2. O que é o AnyChat">
        <p>
          O AnyChat permite que contas profissionais do Instagram respondam
          automaticamente comentários, mensagens e respostas a Stories, enviem
          DMs com links, organizem contatos com tags e acompanhem resultados. O
          serviço funciona exclusivamente pela API oficial da Meta e depende das
          regras, permissões e limites definidos por ela.
        </p>
      </LegalSection>

      <LegalSection title="3. Conta e elegibilidade">
        <LegalList>
          <li>
            Você deve ter pelo menos 18 anos e usar o AnyChat para fins
            profissionais ou empresariais.
          </li>
          <li>
            Só conecte contas de Instagram que você possui ou que está
            autorizado a gerenciar.
          </li>
          <li>
            O acesso ao painel é feito por link enviado ao seu e-mail. Mantenha
            esse e-mail seguro: você responde pelas ações feitas na sua conta e
            pelos membros que convidar para a sua equipe.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Uso permitido">
        <p>
          Você é responsável pelas automações, palavras-chave, mensagens e
          links que configurar. Ao usar o AnyChat, você se compromete a seguir
          os Termos da Plataforma da Meta, os Termos de Uso e as Diretrizes da
          Comunidade do Instagram, o Código de Defesa do Consumidor, a LGPD e
          demais leis aplicáveis. É proibido usar o serviço para:
        </p>
        <LegalList>
          <li>enviar spam, mensagens enganosas ou não solicitadas fora das regras da Meta;</li>
          <li>divulgar produtos ou serviços ilegais, golpes, phishing ou malware;</li>
          <li>assediar, discriminar ou expor terceiros;</li>
          <li>contornar limites técnicos do AnyChat ou da Meta, ou acessar dados sem autorização;</li>
          <li>revender o serviço sem acordo prévio por escrito.</li>
        </LegalList>
        <p>
          Podemos limitar o ritmo de envio, pausar automações ou suspender
          contas que representem risco de abuso, segurança ou violação destas
          regras, avisando você sempre que possível.
        </p>
      </LegalSection>

      <LegalSection title="5. Dados pessoais dos seus seguidores">
        <p>
          Em relação aos dados das pessoas que interagem com a sua conta de
          Instagram, você é o <strong>controlador</strong> e o AnyChat é o{" "}
          <strong>operador</strong>, nos termos da LGPD. Cabe a você ter base
          legal para o tratamento, informar seus seguidores de forma
          transparente e responder aos pedidos dos titulares; nós tratamos esses
          dados somente para executar as automações que você configurou, com as
          medidas de segurança descritas na{" "}
          <Link href="/privacy" className={linkClass}>
            Política de Privacidade
          </Link>
          , e ajudamos você a atender esses pedidos.
        </p>
      </LegalSection>

      <LegalSection title="6. Planos, pagamento e cancelamento">
        <LegalList>
          <li>
            Os planos, preços e limites (como contas conectadas e mensagens por
            mês) estão descritos na página de{" "}
            <Link href="/pricing" className={linkClass}>
              preços
            </Link>{" "}
            e no painel no momento da contratação.
          </li>
          <li>
            A cobrança é recorrente, no período escolhido, por meio de um
            processador de pagamentos. Se o pagamento falhar, o serviço pode
            ser limitado até a regularização.
          </li>
          <li>
            Você pode cancelar a qualquer momento pelo painel ou por e-mail. O
            cancelamento vale ao fim do período já pago, sem multa. Fica
            garantido o direito de arrependimento em até 7 dias da primeira
            contratação, nos termos do art. 49 do Código de Defesa do
            Consumidor, quando aplicável.
          </li>
          <li>
            Mudanças de preço serão comunicadas com pelo menos 30 dias de
            antecedência e valem a partir do período seguinte.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="7. Disponibilidade e serviços de terceiros">
        <p>
          Trabalhamos para manter o AnyChat estável e avisar sobre falhas, mas
          o serviço depende de terceiros, principalmente da Meta, além de
          provedores de hospedagem, e-mail e pagamento. A Meta pode alterar
          sua API, mudar limites, recusar permissões ou restringir contas por
          decisão própria; nesses casos não podemos garantir o funcionamento
          ininterrupto das automações nem o resultado de campanhas.
        </p>
      </LegalSection>

      <LegalSection title="8. Propriedade intelectual e conteúdo">
        <p>
          O conteúdo que você cadastra (mensagens, links, imagens, tags) continua
          sendo seu; você nos autoriza a usá-lo apenas para prestar o serviço.
          A marca, o site e a infraestrutura hospedada do AnyChat pertencem ao
          operador. Partes do software são baseadas em código aberto
          distribuído sob a licença MIT, que continua valendo para esse código.
          Instagram e Meta são marcas da Meta Platforms, Inc.; o AnyChat não é
          afiliado à Meta.
        </p>
      </LegalSection>

      <LegalSection title="9. Responsabilidade">
        <p>
          Na extensão permitida pela lei, o AnyChat não responde por danos
          indiretos, lucros cessantes, decisões da Meta sobre a sua conta ou
          pelo conteúdo das mensagens configuradas por você. A responsabilidade
          total do AnyChat em relação ao serviço fica limitada ao valor pago por
          você nos 12 meses anteriores ao fato. Nada nestes termos afasta
          direitos garantidos ao consumidor pela legislação brasileira.
        </p>
      </LegalSection>

      <LegalSection title="10. Encerramento">
        <p>
          Você pode encerrar sua conta a qualquer momento. Podemos encerrar ou
          suspender contas que violem estes termos ou a lei. Após o
          encerramento, os dados são excluídos conforme a{" "}
          <Link href="/privacy" className={linkClass}>
            Política de Privacidade
          </Link>{" "}
          e a página de{" "}
          <Link href="/data-deletion" className={linkClass}>
            exclusão de dados
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Alterações e lei aplicável">
        <p>
          Podemos atualizar estes termos; mudanças relevantes serão avisadas
          com antecedência por e-mail ou no painel. Estes termos são regidos
          pelas leis brasileiras. Fica eleito o foro da comarca da sede do
          operador, ressalvado o direito do consumidor de propor ação no foro
          do seu domicílio.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import LegalShell, { LegalList, LegalSection } from "@/components/legal-shell";
import CompanyEmailLink from "@/components/company-email-link";

export const metadata: Metadata = {
  title: "Exclusão de Dados - AnyChat",
  description:
    "Como desconectar o Instagram e pedir a exclusão dos seus dados no AnyChat, seja você cliente ou alguém que interagiu com um perfil que usa o AnyChat.",
};

const linkClass = "text-accent underline underline-offset-2";

export default function DataDeletionPage() {
  return (
    <LegalShell
      title="Exclusão de Dados"
      description="Instruções para remover o acesso do AnyChat ao Instagram e pedir a exclusão de dados pessoais. Esta página atende às instruções de exclusão de dados exigidas pela Meta e aos direitos previstos na LGPD."
      updatedAt="30 de outubro de 2026"
    >
      <LegalSection title="Se você é cliente do AnyChat">
        <p>
          <strong>1. Desconectar a conta de Instagram.</strong> Entre no painel,
          abra Configurações e clique em Desconectar na conta desejada. Isso
          apaga imediatamente o token de acesso e os dados ligados àquela conta
          no AnyChat: automações, histórico de envios, contatos, tags e cliques
          em links.
        </p>
        <p>
          <strong>2. Remover o acesso pelo Instagram (opcional).</strong> No app
          do Instagram, vá em Configurações e privacidade › Permissões do site e
          do app (ou Apps e sites) e remova o AnyChat. A partir daí, a Meta deixa
          de enviar dados ao AnyChat.
        </p>
        <p>
          <strong>3. Excluir toda a conta.</strong> Para apagar também o espaço de
          trabalho, membros da equipe e o seu cadastro, envie um e-mail para{" "}
          <CompanyEmailLink subject="Exclusão de dados" /> a partir do e-mail
          usado para entrar, com o assunto &quot;Exclusão de dados&quot;, o nome
          do espaço de trabalho e o @ das contas de Instagram conectadas.
        </p>
      </LegalSection>

      <LegalSection title="Se você comentou ou mandou mensagem para um perfil que usa o AnyChat">
        <p>
          Nesse caso, quem decide sobre os seus dados é o perfil com quem você
          interagiu (o controlador, pela LGPD); o AnyChat processa esses dados
          em nome dele. Você pode:
        </p>
        <LegalList>
          <li>pedir a exclusão diretamente ao perfil; ou</li>
          <li>
            escrever para <CompanyEmailLink subject="Exclusão de dados de seguidor" />{" "}
            informando o seu nome de usuário do Instagram e o perfil com quem
            interagiu. Excluiremos o seu registro de contato, tags, comentários
            e mensagens armazenados pelo AnyChat para aquele perfil e avisaremos
            o cliente responsável.
          </li>
        </LegalList>
        <p>
          A exclusão no AnyChat não apaga comentários ou mensagens do próprio
          Instagram; para isso, use as ferramentas do Instagram ou fale com a
          Meta.
        </p>
      </LegalSection>

      <LegalSection title="Prazos e confirmação">
        <LegalList>
          <li>
            Podemos pedir uma confirmação de identidade (por exemplo, responder
            a partir do e-mail cadastrado ou comprovar o controle da conta de
            Instagram) para evitar exclusões indevidas.
          </li>
          <li>
            Confirmamos o recebimento do pedido e respondemos em até 15 dias. A
            exclusão é concluída em até 30 dias, e você recebe a confirmação por
            e-mail.
          </li>
          <li>
            Mantemos apenas o que a lei exige, como registros de acesso (6
            meses, pelo Marco Civil da Internet) e documentos fiscais e de
            cobrança, pelo prazo legal, sem uso para outras finalidades.
          </li>
        </LegalList>
        <p>
          Mais detalhes sobre quais dados tratamos estão na{" "}
          <Link href="/privacy" className={linkClass}>
            Política de Privacidade
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}

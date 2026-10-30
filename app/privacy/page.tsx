import type { Metadata } from "next";
import Link from "next/link";
import LegalShell, { LegalList, LegalSection } from "@/components/legal-shell";
import CompanyEmailLink from "@/components/company-email-link";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Política de Privacidade - AnyChat",
  description:
    "Como o AnyChat trata os dados dos clientes e das pessoas que interagem com as contas de Instagram conectadas, conforme a LGPD.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Política de Privacidade"
      description="Esta política explica quais dados pessoais o AnyChat trata, por que, por quanto tempo e como você exerce seus direitos previstos na Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD)."
      updatedAt="30 de outubro de 2026"
    >
      <LegalSection title="1. Quem somos">
        <p>
          O AnyChat é um serviço on-line de automação de comentários e mensagens
          diretas (DMs) no Instagram, operado por {company.name}, inscrita no
          CNPJ sob o nº {company.cnpj}, com sede em {company.address}{" "}
          (&quot;AnyChat&quot;, &quot;nós&quot;). O contato do nosso encarregado
          pelo tratamento de dados pessoais é <CompanyEmailLink />.
        </p>
      </LegalSection>

      <LegalSection title="2. Papéis de cada um na LGPD">
        <p>O AnyChat trata dois grupos de dados, com papéis diferentes:</p>
        <LegalList>
          <li>
            <strong>Dados dos clientes</strong> (quem cria conta e usa o painel
            do AnyChat): para estes dados, o AnyChat é o{" "}
            <strong>controlador</strong>.
          </li>
          <li>
            <strong>Dados dos seguidores e demais pessoas</strong> que comentam,
            enviam mensagens ou clicam em links das contas de Instagram
            conectadas pelos clientes: para estes dados, o{" "}
            <strong>cliente é o controlador</strong> e o AnyChat atua como{" "}
            <strong>operador</strong>, tratando os dados apenas para executar as
            automações que o cliente configurou e conforme as instruções dele.
          </li>
        </LegalList>
        <p>
          Se você interagiu com um perfil que usa o AnyChat e quer exercer seus
          direitos, o ideal é falar com o próprio perfil (o controlador). Você
          também pode nos escrever: encaminharemos o pedido ao cliente
          responsável e ajudaremos no que for possível, inclusive na exclusão
          descrita na página de{" "}
          <Link href="/data-deletion" className="text-accent underline underline-offset-2">
            exclusão de dados
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="3. Dados que tratamos">
        <p>
          <strong>Clientes e membros da equipe:</strong>
        </p>
        <LegalList>
          <li>e-mail e nome usados para entrar no painel e convites de equipe;</li>
          <li>
            dados do espaço de trabalho, do plano contratado e referências de
            cobrança (os dados de pagamento, como cartão, são tratados pelo
            processador de pagamentos e não ficam armazenados no AnyChat);
          </li>
          <li>
            registros de acesso à aplicação (data, hora e endereço IP), que
            somos obrigados a guardar pelo Marco Civil da Internet;
          </li>
          <li>
            dados da conta de Instagram conectada: identificador, nome de
            usuário e nome do perfil, publicações selecionadas, histórico do
            número de seguidores e o token de acesso fornecido pela Meta
            (armazenado de forma criptografada);
          </li>
          <li>
            configurações das automações: palavras-chave, mensagens, links e
            tags.
          </li>
        </LegalList>
        <p>
          <strong>
            Pessoas que interagem com as contas conectadas (tratados em nome do
            cliente):
          </strong>
        </p>
        <LegalList>
          <li>
            identificador do Instagram e nome de usuário de quem comenta ou envia
            mensagem;
          </li>
          <li>
            texto dos comentários, mensagens e respostas a Stories recebidos
            pelas contas conectadas, na medida necessária para identificar a
            palavra-chave, enviar a resposta e exibir a conversa na caixa de
            entrada;
          </li>
          <li>
            registro de contato com data da primeira e da última interação,
            origem e tags aplicadas pelo cliente ou pelas campanhas;
          </li>
          <li>
            histórico dos envios (mensagem enviada, data e situação);
          </li>
          <li>
            cliques em links rastreados: data, navegador (user agent), página
            de origem e uma versão irreversível (hash) do endereço IP ou do
            destinatário, usada só para contar cliques únicos.
          </li>
        </LegalList>
        <p>
          Não pedimos nem armazenamos senhas do Instagram, não fazemos scraping
          e só recebemos dados pela API oficial da Meta, de acordo com as
          permissões autorizadas pelo cliente.
        </p>
      </LegalSection>

      <LegalSection title="4. Para que usamos os dados e com qual base legal">
        <LegalList>
          <li>
            <strong>Prestar o serviço</strong> (entrar no painel, conectar o
            Instagram, executar automações, mostrar relatórios e a caixa de
            entrada): execução do contrato com o cliente (art. 7º, V, da LGPD).
          </li>
          <li>
            <strong>Cobrança, obrigações fiscais e guarda de registros de
            acesso</strong>: cumprimento de obrigação legal ou regulatória (art.
            7º, II).
          </li>
          <li>
            <strong>Segurança, prevenção a fraudes e abusos, diagnóstico de
            falhas e alertas de funcionamento</strong>: legítimo interesse (art.
            7º, IX), sempre limitado ao necessário.
          </li>
          <li>
            <strong>Comunicações sobre a conta</strong> (avisos de falha,
            mudanças no serviço e nesta política): execução do contrato e
            legítimo interesse.
          </li>
        </LegalList>
        <p>
          Quanto aos dados de seguidores, a base legal é definida pelo cliente,
          que é o controlador. O AnyChat não usa esses dados para finalidades
          próprias, não os vende e não os usa para anúncios.
        </p>
      </LegalSection>

      <LegalSection title="5. Com quem compartilhamos">
        <p>
          Compartilhamos dados apenas com quem é necessário para o serviço
          funcionar, sob contrato e com obrigações de confidencialidade e
          segurança:
        </p>
        <LegalList>
          <li>a Meta, por meio da API oficial do Instagram, para receber eventos e enviar as mensagens;</li>
          <li>provedores de hospedagem, banco de dados, filas e monitoramento;</li>
          <li>provedor de envio de e-mails (links de acesso e avisos);</li>
          <li>processador de pagamentos, para a cobrança dos planos;</li>
          <li>autoridades públicas, quando exigido por lei ou ordem judicial.</li>
        </LegalList>
        <p>
          Alguns desses fornecedores podem armazenar dados fora do Brasil. Nesses
          casos, a transferência internacional segue o art. 33 da LGPD, com
          cláusulas contratuais e garantias adequadas de proteção.
        </p>
      </LegalSection>

      <LegalSection title="6. Por quanto tempo guardamos">
        <LegalList>
          <li>
            Dados da conta, automações, contatos, conversas e históricos ficam
            guardados enquanto o cliente mantiver a conta ativa ou até que ele
            os exclua.
          </li>
          <li>
            Ao desconectar uma conta de Instagram, o token de acesso e os dados
            ligados a ela (automações, históricos de envio, contatos, tags e
            cliques) são excluídos.
          </li>
          <li>
            Após o encerramento da conta ou um pedido de exclusão, apagamos os
            dados em até 30 dias, exceto o que a lei nos obriga a manter, como
            registros de acesso (6 meses, Marco Civil da Internet) e documentos
            fiscais e de cobrança (pelo prazo legal aplicável).
          </li>
          <li>
            Cópias de segurança são sobrescritas em ciclos regulares e não são
            usadas para outras finalidades.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="7. Segurança">
        <p>
          Usamos conexões criptografadas (HTTPS), criptografia dos tokens de
          acesso, verificação de assinatura dos eventos enviados pela Meta,
          controle de acesso por espaço de trabalho e acesso interno restrito
          ao mínimo necessário. Em caso de incidente de segurança que possa
          gerar risco relevante, comunicaremos os clientes afetados e a ANPD,
          conforme a LGPD.
        </p>
      </LegalSection>

      <LegalSection title="8. Seus direitos">
        <p>
          Pelo art. 18 da LGPD, o titular pode pedir: confirmação de que
          tratamos seus dados; acesso; correção de dados incompletos ou
          desatualizados; anonimização, bloqueio ou eliminação de dados
          desnecessários ou tratados em desconformidade; portabilidade;
          eliminação de dados tratados com base no consentimento; informação
          sobre compartilhamentos; e revisão de decisões automatizadas.
        </p>
        <p>
          Para isso, escreva para <CompanyEmailLink subject="Direitos do titular (LGPD)" />{" "}
          a partir do e-mail cadastrado ou informando seu nome de usuário do
          Instagram. Podemos pedir uma confirmação de identidade antes de
          atender. Respondemos em até 15 dias. Se o pedido envolver dados de
          seguidores de um cliente, ele será encaminhado ao cliente
          (controlador). Você também pode apresentar reclamação à Autoridade
          Nacional de Proteção de Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          Usamos apenas cookies necessários: o de sessão, que mantém você
          conectado ao painel, e o de preferência de idioma. Podemos usar
          medição de audiência agregada do site, sem cookies de publicidade e
          sem identificar visitantes individualmente.
        </p>
      </LegalSection>

      <LegalSection title="10. Crianças e adolescentes">
        <p>
          O AnyChat é destinado a empresas e profissionais maiores de 18 anos e
          não é direcionado a crianças ou adolescentes.
        </p>
      </LegalSection>

      <LegalSection title="11. Alterações desta política">
        <p>
          Podemos atualizar esta política para refletir mudanças no serviço ou
          na lei. Mudanças relevantes serão avisadas por e-mail ou no painel
          antes de entrarem em vigor. A data no topo indica a última
          atualização.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

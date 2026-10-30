import Link from "next/link";
import { company } from "@/lib/company";
import CompanyEmailLink from "@/components/company-email-link";

interface LegalShellProps {
  title: string;
  description: string;
  updatedAt: string;
  children: React.ReactNode;
}

export default function LegalShell({
  title,
  description,
  updatedAt,
  children,
}: LegalShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-lg font-bold text-foreground">AnyChat</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-muted transition hover:text-foreground"
          >
            Entrar
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-sm font-semibold uppercase text-accent">
          Última atualização: {updatedAt}
        </p>
        <h1 className="mt-4 text-4xl font-black text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">{description}</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-foreground">
          {children}
        </div>
        <footer className="mt-14 border-t border-border pt-6 text-sm leading-7 text-muted">
          <p className="font-semibold text-foreground">Quem opera o AnyChat</p>
          <p className="mt-2">
            {company.name} · CNPJ {company.cnpj}
            <br />
            {company.address}
            <br />
            Contato e encarregado de dados: <CompanyEmailLink />
          </p>
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Páginas legais">
            <Link href="/terms" className="hover:text-foreground">Termos de uso</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacidade</Link>
            <Link href="/data-deletion" className="hover:text-foreground">Exclusão de dados</Link>
          </nav>
        </footer>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}

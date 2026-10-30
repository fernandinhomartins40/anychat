import { company } from "@/lib/company";

/// The operator's contact email as a mailto link, or the plain placeholder
/// while NEXT_PUBLIC_COMPANY_EMAIL is unset (a mailto to "[preencher …]" would
/// only confuse whoever clicks it).
export default function CompanyEmailLink({ subject }: { subject?: string }) {
  if (!company.email.includes("@")) {
    return <strong>{company.email}</strong>;
  }
  const href = subject
    ? `mailto:${company.email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${company.email}`;
  return (
    <a
      href={href}
      className="font-semibold text-accent underline underline-offset-2"
    >
      {company.email}
    </a>
  );
}

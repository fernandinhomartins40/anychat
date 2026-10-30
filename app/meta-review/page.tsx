import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal-shell";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Meta App Review Support - AnyChat",
  description:
    "Meta App Review notes for AnyChat's official Instagram private reply workflow.",
};

export default function MetaReviewPage() {
  return (
    <LegalShell
      title="Meta App Review Support"
      description="AnyChat is a hosted service for Instagram professional accounts that want to send private replies after keyword comments on their own posts or reels. This page is in English for Meta reviewers; the product interface defaults to Brazilian Portuguese."
      updatedAt="30 de outubro de 2026"
    >
      <section>
        <h2 className="text-xl font-bold text-foreground">Operator</h2>
        <p className="mt-3">
          The hosted AnyChat service is operated by {company.name} (CNPJ{" "}
          {company.cnpj}). Customers never create their own Meta app: they
          click Connect Instagram and authorize the operator&apos;s app through
          Instagram Login. Policies:{" "}
          <Link href="/privacy" className="text-accent underline underline-offset-2">
            privacy policy
          </Link>
          ,{" "}
          <Link href="/terms" className="text-accent underline underline-offset-2">
            terms of service
          </Link>{" "}
          and{" "}
          <Link href="/data-deletion" className="text-accent underline underline-offset-2">
            data deletion instructions
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground">User Flow</h2>
        <p className="mt-3">
          A business owner signs in by email, connects an Instagram professional
          account through Meta OAuth, creates a keyword campaign for a post or
          reel, and receives a webhook when someone comments. AnyChat queues
          the event, deduplicates it, checks rate limits, then sends a private
          reply using the comment ID.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground">Compliance Position</h2>
        <p className="mt-3">
          The app uses official Meta APIs, verifies webhook signatures, encrypts
          tokens, avoids scraping, avoids password collection, and sends no more
          than one private reply for a matched campaign/comment pair.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground">Review Test Notes</h2>
        <p className="mt-3">
          Reviewers can use a Meta test business, connect an Instagram
          professional account, create a keyword such as LINK, comment that
          keyword on the selected media, and confirm that the private reply is
          sent and logged once.
        </p>
      </section>
    </LegalShell>
  );
}

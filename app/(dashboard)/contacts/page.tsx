"use client";

/**
 * Contacts Page
 *
 * Everyone who commented on a campaign or sent a DM, with their tags.
 * Filter by name or tag, edit tags inline, export the filtered list as CSV.
 */

import { useI18n } from "@/lib/i18n/provider";
import { useCallback, useEffect, useState } from "react";
import AccountSelect, { type AccountOption } from "@/components/account-select";

interface Contact {
  id: string;
  username: string | null;
  igsid: string;
  instagramAccountUsername: string;
  tags: string[];
  firstSeenAt: string;
  lastInteractionAt: string;
  lastSource: "COMMENT" | "DM";
}

interface TagSummary {
  name: string;
  count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function ContactTags({
  contact,
  onChange,
}: {
  contact: Contact;
  onChange: (tags: string[]) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(body: { addTags?: string[]; removeTags?: string[] }) {
    setBusy(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) onChange(data.data.tags);
    } catch (err) {
      console.error("Failed to update tags:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {contact.tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-xs text-accent"
        >
          {tag}
          <button
            type="button"
            disabled={busy}
            onClick={() => void update({ removeTags: [tag] })}
            aria-label={t("Remove tag {tag}", { tag })}
            className="leading-none hover:text-foreground disabled:opacity-40"
          >
            ×
          </button>
        </span>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = draft.trim();
          if (!value) return;
          setDraft("");
          void update({ addTags: [value] });
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
          maxLength={40}
          placeholder={t("+ tag")}
          aria-label={t("Add a tag")}
          className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-muted placeholder:text-muted/60 focus:border-border focus:outline-none"
        />
      </form>
    </div>
  );
}

export default function ContactsPage() {
  const { t, locale } = useI18n();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [page, setPage] = useState(1);

  const filterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (appliedSearch) params.set("search", appliedSearch);
    if (tagFilter) params.set("tag", tagFilter);
    if (selectedAccountId !== "all") params.set("instagramAccountId", selectedAccountId);
    return params;
  }, [appliedSearch, tagFilter, selectedAccountId]);

  const fetchContacts = useCallback(async () => {
    try {
      const params = filterParams();
      params.set("page", String(page));
      const res = await fetch(`/api/contacts?${params}`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.data.contacts);
        setTags(data.data.tags);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [filterParams, page]);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setAccounts(payload.data.instagramAccounts ?? []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchContacts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchContacts]);

  // Search as the user types, but only after a short pause.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() === appliedSearch) return;
      setLoading(true);
      setAppliedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, appliedSearch]);

  function chooseTag(tag: string | null) {
    setLoading(true);
    setTagFilter(tag);
    setPage(1);
  }

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
    setPage(1);
  }

  function updateContactTags(id: string, next: string[]) {
    setContacts((list) => list.map((c) => (c.id === id ? { ...c, tags: next } : c)));
    // Counts per tag may have changed; refresh them quietly.
    void fetchContacts();
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {t("Everyone who commented on a campaign or sent you a DM shows up here automatically. Campaigns can tag people for you.")}
      </p>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search by @username")}
            className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-border-hover focus:outline-none"
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => chooseTag(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tagFilter === null
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "bg-surface text-muted border border-border hover:border-border-hover hover:text-foreground"
                }`}
              >
                {t("All")}
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => chooseTag(tag.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tagFilter === tag.name
                      ? "bg-accent/15 text-accent border border-accent/20"
                      : "bg-surface text-muted border border-border hover:border-border-hover hover:text-foreground"
                  }`}
                >
                  {tag.name} <span className="opacity-60">{tag.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {accounts.length > 1 && (
            <AccountSelect accounts={accounts} value={selectedAccountId} onChange={handleAccountChange} />
          )}
          <a
            href={`/api/contacts?${(() => {
              const params = filterParams();
              params.set("format", "csv");
              return params;
            })()}`}
            className="px-3 py-2 rounded-lg text-xs font-medium text-muted border border-border hover:text-foreground hover:border-border-hover transition-all"
          >
            {t("Export CSV")}
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="panel rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider sm:px-6">{t("Contact")}</th>
                <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider sm:px-6">{t("Tags")}</th>
                <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider sm:px-6">{t("Account")}</th>
                <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider sm:px-6">{t("Last interaction")}</th>
                <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider sm:px-6">{t("First seen")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && contacts.length === 0 &&
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4 sm:px-6">
                      <div className="h-4 bg-surface-hover rounded" />
                    </td>
                  </tr>
                ))}
              {!loading && contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted sm:px-6">
                    {appliedSearch || tagFilter
                      ? t("No contacts match these filters")
                      : t("No contacts yet. They appear as soon as someone comments on a campaign or sends you a DM.")}
                  </td>
                </tr>
              )}
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="px-4 py-4 sm:px-6">
                    <span className="font-medium text-foreground">
                      {contact.username ? `@${contact.username}` : t("Unknown username")}
                    </span>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <ContactTags contact={contact} onChange={(next) => updateContactTags(contact.id, next)} />
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span className="text-muted">@{contact.instagramAccountUsername}</span>
                  </td>
                  <td className="px-4 py-4 text-muted whitespace-nowrap sm:px-6">
                    {formatDate(contact.lastInteractionAt)}{" "}
                    <span className="text-xs opacity-70">
                      · {contact.lastSource === "DM" ? t("DM") : t("Comment")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted whitespace-nowrap sm:px-6">
                    {formatDate(contact.firstSeenAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 border-t border-border sm:px-6">
            <p className="text-xs text-muted">
              {t("Showing {start}–{end} of {total}", {
                start: (pagination.page - 1) * pagination.limit + 1,
                end: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage(page - 1);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted border border-border hover:text-foreground hover:border-border-hover transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                {t("Previous")}
              </button>
              <span className="text-xs text-muted px-2">
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => {
                  setLoading(true);
                  setPage(page + 1);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted border border-border hover:text-foreground hover:border-border-hover transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                {t("Next")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

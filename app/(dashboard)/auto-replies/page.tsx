"use client";

/**
 * Auto Replies Page
 *
 * Per connected account: a welcome message for someone's first-ever DM and a
 * default reply for DMs no campaign matches, plus the latest ones sent.
 */

import { useI18n } from "@/lib/i18n/provider";
import { useCallback, useEffect, useState } from "react";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import StatusBadge from "@/components/status-badge";

interface Settings {
  welcomeEnabled: boolean;
  welcomeMessage: string;
  defaultReplyEnabled: boolean;
  defaultReplyMessage: string;
  defaultReplyCooldownHours: number;
}

interface AutoReplyLog {
  id: string;
  kind: "WELCOME" | "DEFAULT_REPLY";
  status: string;
  recipientId: string;
  recipientName: string | null;
  inboundText: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

const MIN_COOLDOWN = 1;
const MAX_COOLDOWN = 168;
const MAX_LENGTH = 1000;

const EMPTY: Settings = {
  welcomeEnabled: false,
  welcomeMessage: "",
  defaultReplyEnabled: false,
  defaultReplyMessage: "",
  defaultReplyCooldownHours: 24,
};

function Toggle({
  on,
  onToggle,
  label,
  disabled,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        on ? "bg-accent" : "bg-zinc-300"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          on ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

const textareaClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none resize-y disabled:opacity-60";

export default function AutoRepliesPage() {
  const { t, locale } = useI18n();
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [settings, setSettings] = useState<Settings>(EMPTY);
  const [cooldownDraft, setCooldownDraft] = useState("24");
  const [logs, setLogs] = useState<AutoReplyLog[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((payload) => {
        if (!payload.success) return;
        const list: AccountOption[] = payload.data.instagramAccounts ?? [];
        setAccounts(list);
        if (list[0]) setAccountId((current) => current || list[0].id);
      })
      .catch(console.error)
      .finally(() => setAccountsLoaded(true));
  }, []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/auto-replies?instagramAccountId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.success) {
        setSettings(data.data.settings);
        setCooldownDraft(String(data.data.settings.defaultReplyCooldownHours));
        setLogs(data.data.logs);
        setCanEdit(data.data.canEdit);
      }
    } catch (err) {
      console.error("Failed to load auto replies:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accountId) return;
    const timer = window.setTimeout(() => void load(accountId), 0);
    return () => window.clearTimeout(timer);
  }, [accountId, load]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  const cooldown = Number(cooldownDraft);
  const cooldownValid =
    Number.isInteger(cooldown) && cooldown >= MIN_COOLDOWN && cooldown <= MAX_COOLDOWN;
  const welcomeMissing = settings.welcomeEnabled && !settings.welcomeMessage.trim();
  const defaultMissing = settings.defaultReplyEnabled && !settings.defaultReplyMessage.trim();
  const canSave = canEdit && !saving && !loading && cooldownValid && !welcomeMissing && !defaultMissing;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/auto-replies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramAccountId: accountId,
          ...settings,
          defaultReplyCooldownHours: cooldown,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data.settings);
        setNotice({ kind: "ok", text: t("Auto replies saved") });
      } else {
        setNotice({ kind: "error", text: t("Could not save auto replies. Try again.") });
      }
    } catch {
      setNotice({ kind: "error", text: t("Could not save auto replies. Try again.") });
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (accountsLoaded && accounts.length === 0) {
    return (
      <div className="panel rounded p-6 text-sm text-muted">
        {t("Connect an Instagram account to set up auto replies.")}
      </div>
    );
  }

  const disabled = !canEdit || loading;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {t("Answer DMs that no campaign covers. A campaign keyword always wins, and a person never gets both auto replies for the same message.")}
      </p>

      {accounts.length > 1 && (
        <AccountSelect
          accounts={accounts}
          value={accountId}
          onChange={setAccountId}
          includeAll={false}
        />
      )}

      {!canEdit && (
        <p className="text-sm text-warning">{t("Only owners and admins can change auto replies.")}</p>
      )}

      <section className="panel rounded p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("Welcome message")}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("Sent once, the first time someone ever sends this account a DM.")}
            </p>
          </div>
          <Toggle
            on={settings.welcomeEnabled}
            onToggle={() => update("welcomeEnabled", !settings.welcomeEnabled)}
            label={t("Welcome message")}
            disabled={disabled}
          />
        </div>
        <textarea
          value={settings.welcomeMessage}
          onChange={(e) => update("welcomeMessage", e.target.value)}
          placeholder={t("Hi {username}! Thanks for your message. We'll get back to you soon.", { username: "{username}" })}
          rows={3}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          className={textareaClass}
        />
        {welcomeMissing && <p className="text-xs text-error">{t("Write the message before turning it on.")}</p>}
      </section>

      <section className="panel rounded p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("Default reply")}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("Sent when a DM matches no active campaign keyword.")}
            </p>
          </div>
          <Toggle
            on={settings.defaultReplyEnabled}
            onToggle={() => update("defaultReplyEnabled", !settings.defaultReplyEnabled)}
            label={t("Default reply")}
            disabled={disabled}
          />
        </div>
        <textarea
          value={settings.defaultReplyMessage}
          onChange={(e) => update("defaultReplyMessage", e.target.value)}
          placeholder={t("Got your message, {username}! We'll reply as soon as we can.", { username: "{username}" })}
          rows={3}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          className={textareaClass}
        />
        {defaultMissing && <p className="text-xs text-error">{t("Write the message before turning it on.")}</p>}
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("Cooldown (hours)")}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_COOLDOWN}
            max={MAX_COOLDOWN}
            step={1}
            value={cooldownDraft}
            onChange={(e) => {
              setCooldownDraft(e.target.value);
              setNotice(null);
            }}
            disabled={disabled}
            className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/40 focus:outline-none disabled:opacity-60"
          />
          <span className={`text-xs ${cooldownValid ? "text-muted" : "text-error"}`}>
            {t("Each person gets at most one auto reply in this period (1 to 168 hours).")}
          </span>
        </label>
      </section>

      <p className="text-xs text-muted">
        {t("Use {username} to insert the person's Instagram handle.", { username: "{username}" })}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canSave}
          className="px-4 py-2 rounded-lg bg-accent text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? t("Saving…") : t("Save changes")}
        </button>
        {notice && (
          <span className={`text-sm ${notice.kind === "ok" ? "text-success" : "text-error"}`}>
            {notice.text}
          </span>
        )}
      </div>

      <section className="panel rounded overflow-hidden">
        <h2 className="px-4 py-4 text-base font-semibold text-foreground border-b border-border sm:px-6">
          {t("Recent auto replies")}
        </h2>
        {logs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted sm:px-6">
            {t("No auto replies sent yet.")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {log.recipientName ? `@${log.recipientName}` : t("Unknown username")}
                    <span className="ml-2 text-xs font-normal text-muted">
                      {log.kind === "WELCOME" ? t("Welcome message") : t("Default reply")}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-muted whitespace-nowrap">
                      {formatDate(log.sentAt ?? log.createdAt)}
                    </span>
                    <StatusBadge status={log.status} />
                  </span>
                </div>
                <p className="truncate text-muted">“{log.inboundText}”</p>
                {log.errorMessage && <p className="text-xs text-error break-words">{log.errorMessage}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/**
 * Active alerts, loaded from a real Postgres: the webhook query unpacks the
 * stored JSON payload and the delivery stats are grouped in SQL, neither of
 * which the mocks can check. Skipped without a database:
 *
 *   TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/postgres \
 *     npx vitest run __tests__/health.db.test.ts
 *
 * Builds the schema from prisma/migrations inside a throwaway Postgres schema.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "../app/generated/prisma/client";

const DATABASE_URL = process.env.TEST_DATABASE_URL;
const MIGRATIONS_DIR = path.join(__dirname, "..", "prisma", "migrations");

const state = vi.hoisted(() => ({
  db: undefined as unknown as import("../app/generated/prisma/client").PrismaClient,
  workspaceId: "",
}));

vi.mock("@/lib/db/client", () => ({
  get prisma() {
    return state.db;
  },
}));
vi.mock("@/lib/auth", () => ({
  getCurrentWorkspaceId: async () => state.workspaceId,
}));
vi.mock("@/lib/i18n/server", async () => {
  const { createI18n } = await import("../lib/i18n");
  return { getI18n: async () => createI18n("en") };
});
vi.mock("@/lib/ops/worker-health", () => ({
  getWorkerHealth: async () => ({ healthy: true, heartbeat: null, ageMs: 0 }),
}));

import { GET } from "../app/api/health/issues/route";
import { loadHealthInput } from "../lib/health/load";

const schema = `health_${randomBytes(4).toString("hex")}`;
let sql: Client;

describe.skipIf(!DATABASE_URL)("health issues on a real Postgres", () => {
  beforeAll(async () => {
    sql = new Client({ connectionString: DATABASE_URL });
    await sql.connect();
    await sql.query(`CREATE SCHEMA "${schema}"`);
    await sql.query(`SET search_path TO "${schema}"`);
    const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    for (const dir of dirs) {
      await sql.query(readFileSync(path.join(MIGRATIONS_DIR, dir, "migration.sql"), "utf8"));
    }
    // ws_a: acc_a is busy and healthy, acc_quiet has a campaign but no
    // webhook in 48h and a failing campaign. ws_b exists to prove isolation.
    await sql.query(`
      INSERT INTO "User" ("id", "email", "updatedAt") VALUES ('user_a', 'a@test.dev', now()), ('user_b', 'b@test.dev', now());
      INSERT INTO "Workspace" ("id", "name", "ownerId", "updatedAt")
        VALUES ('ws_a', 'A', 'user_a', now()), ('ws_b', 'B', 'user_b', now());
      INSERT INTO "InstagramAccount" ("id", "workspaceId", "instagramId", "username", "accessToken", "tokenExpiresAt", "webhookSubscribed", "connectedAt", "updatedAt")
        VALUES ('acc_a', 'ws_a', 'ig_a', 'brand_a', 'token', now() + interval '30 days', true, now() - interval '10 days', now()),
               ('acc_quiet', 'ws_a', 'ig_quiet', 'quiet', 'token', now() + interval '2 days', true, now() - interval '10 days', now()),
               ('acc_b', 'ws_b', 'ig_b', 'brand_b', 'token', null, false, now() - interval '10 days', now());
      INSERT INTO "Automation" ("id", "workspaceId", "instagramAccountId", "name", "keywords", "dmMessage", "isActive", "updatedAt")
        VALUES ('camp_a', 'ws_a', 'acc_a', 'Busy', '{LINK}', 'hi', true, now()),
               ('camp_quiet', 'ws_a', 'acc_quiet', 'Broken', '{LINK}', 'hi', true, now()),
               ('camp_paused', 'ws_a', 'acc_quiet', 'Paused', '{LINK}', 'hi', false, now()),
               ('camp_b', 'ws_b', 'acc_b', 'Other', '{LINK}', 'hi', true, now());
      INSERT INTO "WebhookEvent" ("id", "workspaceId", "object", "payload", "status", "createdAt")
        VALUES ('wh_1', 'ws_a', 'instagram', '{"object":"instagram","entry":[{"id":"ig_a"}]}', 'PROCESSED', now() - interval '1 hour'),
               ('wh_2', 'ws_a', 'instagram', '{"object":"instagram","entry":[{"id":"ig_a"}]}', 'PROCESSED', now() - interval '3 hours'),
               ('wh_old', 'ws_a', 'instagram', '{"object":"instagram","entry":[{"id":"ig_quiet"}]}', 'PROCESSED', now() - interval '3 days'),
               ('wh_odd', 'ws_a', 'instagram', '{"object":"instagram","entry":{"id":"ig_quiet"}}', 'PROCESSED', now() - interval '1 hour'),
               ('wh_b', 'ws_b', 'instagram', '{"object":"instagram","entry":[{"id":"ig_b"}]}', 'PROCESSED', now() - interval '1 hour');
      INSERT INTO "DmLog" ("id", "workspaceId", "automationId", "instagramAccountId", "commenterId", "commentText", "commentId", "status", "errorMessage", "createdAt", "updatedAt")
        VALUES ('l1', 'ws_a', 'camp_a', 'acc_a', 'p1', 'LINK', 'c1', 'SENT', null, now() - interval '1 hour', now()),
               ('l2', 'ws_a', 'camp_quiet', 'acc_quiet', 'p2', 'LINK', 'c2', 'FAILED', 'Bad token', now() - interval '1 hour', now()),
               ('l3', 'ws_a', 'camp_quiet', 'acc_quiet', 'p3', 'LINK', 'c3', 'FAILED', 'Bad token', now() - interval '2 hours', now()),
               ('l4', 'ws_a', 'camp_quiet', 'acc_quiet', 'p4', 'LINK', 'c4', 'FAILED', 'Other', now() - interval '2 hours', now()),
               ('l5', 'ws_a', 'camp_quiet', 'acc_quiet', 'p5', 'LINK', 'c5', 'SENT', null, now() - interval '5 days', now()),
               ('l6', 'ws_a', 'camp_paused', 'acc_quiet', 'p6', 'LINK', 'c6', 'FAILED', 'Paused fail', now() - interval '1 hour', now()),
               ('l7', 'ws_a', 'camp_a', 'acc_a', 'p7', 'LINK', 'c7', 'FAILED', 'The action is invalid since it''s not the thread owner. [code=100 sub=2534037]', now() - interval '1 hour', now()),
               ('l8', 'ws_b', 'camp_b', 'acc_b', 'p8', 'LINK', 'c8', 'FAILED', 'not the thread owner', now() - interval '1 hour', now());
    `);
    // The adapter's schema option only qualifies generated queries; the raw
    // webhook query needs search_path, just like "public" in production.
    state.db = new PrismaClient({
      adapter: new PrismaPg(
        { connectionString: DATABASE_URL, options: `-c search_path=${schema}` },
        { schema }
      ),
    });
    state.workspaceId = "ws_a";
  }, 60_000);

  afterAll(async () => {
    await state.db?.$disconnect();
    if (sql) {
      await sql.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await sql.end();
    }
  });

  it("loads webhook activity, delivery stats and errors for one workspace", async () => {
    const input = await loadHealthInput("ws_a");

    const byId = Object.fromEntries(input.accounts.map((a) => [a.id, a]));
    expect(Object.keys(byId).sort()).toEqual(["acc_a", "acc_quiet"]);
    expect(byId.acc_a.lastWebhookAt).toBeInstanceOf(Date);
    expect(Date.now() - byId.acc_a.lastWebhookAt!.getTime()).toBeLessThan(2 * 3600_000);
    // Only an old event and a malformed payload: nothing in the window.
    expect(byId.acc_quiet.lastWebhookAt).toBeNull();

    const campaigns = Object.fromEntries(input.campaigns.map((c) => [c.id, c]));
    expect(Object.keys(campaigns).sort()).toEqual(["camp_a", "camp_quiet"]);
    expect(campaigns.camp_quiet.stats).toEqual({ sent: 0, failed: 3, rateLimited: 0, planLimited: 0 });
    expect(campaigns.camp_quiet.topError).toEqual({ message: "Bad token", count: 2 });
    expect(campaigns.camp_a.stats.sent).toBe(1);

    expect(input.threadOwnerErrors).toBe(1);
    expect(input.workerHealthy).toBe(true);
  });

  it("serves the issues and checklist from the API", async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.success).toBe(true);
    const codes = body.data.issues.map((issue: { code: string }) => issue.code).sort();
    expect(codes).toEqual([
      "campaign_not_sending",
      "conversation_control",
      "token_expiring",
      "webhook_silent",
    ]);
    expect(body.data.checklist).toHaveLength(6);
  });
});

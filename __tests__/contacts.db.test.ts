/**
 * Contacts and tags, tested against a real Postgres: the upserts, the
 * case-insensitive search and the tag filter are all SQL the mocks cannot
 * check. Skipped without a database:
 *
 *   TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/postgres \
 *     npx vitest run __tests__/contacts.db.test.ts
 *
 * Builds the schema from prisma/migrations inside a throwaway Postgres schema.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { NextRequest } from "next/server";
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

import { GET } from "../app/api/contacts/route";
import { PATCH } from "../app/api/contacts/[id]/route";
import { recordContactInteraction, recordInboundDmContactSafely } from "../lib/contacts/record";

const schema = `contacts_${randomBytes(4).toString("hex")}`;
let sql: Client;

function get(query: string) {
  return GET(new NextRequest(`http://localhost/api/contacts?${query}`));
}

function patch(id: string, body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );
}

describe.skipIf(!DATABASE_URL)("contacts on a real Postgres", () => {
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
    await sql.query(`
      INSERT INTO "User" ("id", "email", "updatedAt") VALUES ('user_a', 'a@test.dev', now()), ('user_b', 'b@test.dev', now());
      INSERT INTO "Workspace" ("id", "name", "ownerId", "updatedAt")
        VALUES ('ws_a', 'A', 'user_a', now()), ('ws_b', 'B', 'user_b', now());
      INSERT INTO "InstagramAccount" ("id", "workspaceId", "instagramId", "username", "accessToken", "updatedAt")
        VALUES ('acc_a', 'ws_a', 'ig_a', 'brand_a', 'token', now()),
               ('acc_b', 'ws_b', 'ig_b', 'brand_b', 'token', now());
    `);
    state.db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }, { schema }) });
    state.workspaceId = "ws_a";
  }, 60_000);

  afterAll(async () => {
    await state.db?.$disconnect();
    if (sql) {
      await sql.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await sql.end();
    }
  });

  it("records a contact once and merges tags across repeated interactions", async () => {
    const first = new Date("2026-10-01T10:00:00Z");
    const later = new Date("2026-10-02T10:00:00Z");
    await recordContactInteraction({
      workspaceId: "ws_a", instagramAccountId: "acc_a", igsid: "p1",
      username: "Maria.Silva", source: "COMMENT", tagNames: ["Lead"], at: first,
    });
    // A retried job and a second campaign: no duplicate contact, tags merge.
    await recordContactInteraction({
      workspaceId: "ws_a", instagramAccountId: "acc_a", igsid: "p1",
      username: "Maria.Silva", source: "COMMENT", tagNames: ["lead"], at: first,
    });
    await recordContactInteraction({
      workspaceId: "ws_a", instagramAccountId: "acc_a", igsid: "p1",
      source: "DM", tagNames: ["ebook"], at: later,
    });

    const contacts = await state.db.contact.findMany({ include: { tags: { include: { tag: true } } } });
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({
      username: "Maria.Silva",
      lastSource: "DM",
      firstSeenAt: first,
      lastInteractionAt: later,
    });
    expect(contacts[0].tags.map((t) => t.tag.name).sort()).toEqual(["ebook", "lead"]);
  });

  it("records an inbound DM sender by the business account's Instagram id", async () => {
    await recordInboundDmContactSafely({ instagramUserId: "ig_a", senderId: "p2" });
    // Another workspace's contact, which must never leak into ws_a's results.
    await recordInboundDmContactSafely({ instagramUserId: "ig_b", senderId: "p3" });

    expect(await state.db.contact.count({ where: { workspaceId: "ws_a" } })).toBe(2);
    expect(await state.db.contact.count({ where: { workspaceId: "ws_b" } })).toBe(1);
  });

  it("lists, searches case-insensitively and filters by tag within the workspace", async () => {
    const all = await (await get("")).json();
    expect(all.data.pagination.total).toBe(2);
    expect(all.data.tags).toEqual([
      { name: "ebook", count: 1 },
      { name: "lead", count: 1 },
    ]);

    const search = await (await get("search=%40maria")).json();
    expect(search.data.contacts.map((c: { username: string }) => c.username)).toEqual(["Maria.Silva"]);

    const tagged = await (await get("tag=lead")).json();
    expect(tagged.data.contacts).toHaveLength(1);
    expect(tagged.data.contacts[0].tags.sort()).toEqual(["ebook", "lead"]);
  });

  it("adds and removes tags, and refuses another workspace's contact", async () => {
    const contact = await state.db.contact.findFirstOrThrow({ where: { igsid: "p2" } });

    const added = await (await patch(contact.id, { addTags: ["VIP ", "lead"] })).json();
    // Added together, so they share a createdAt and sort by name.
    expect(added.data.tags).toEqual(["lead", "vip"]);

    const removed = await (await patch(contact.id, { removeTags: ["VIP"] })).json();
    expect(removed.data.tags).toEqual(["lead"]);

    const foreign = await state.db.contact.findFirstOrThrow({ where: { workspaceId: "ws_b" } });
    expect((await patch(foreign.id, { addTags: ["x"] })).status).toBe(404);
  });

  it("exports the filtered list as CSV with formula cells neutralized", async () => {
    await recordContactInteraction({
      workspaceId: "ws_a", instagramAccountId: "acc_a", igsid: "p4",
      username: "=HYPERLINK(1)", source: "COMMENT",
    });

    const res = await get("format=csv");
    expect(res.headers.get("content-type")).toContain("text/csv");
    const lines = (await res.text()).trim().split("\r\n");
    expect(lines[0]).toBe(
      '"username","instagram_account","tags","first_seen_at","last_interaction_at","last_source","instagram_scoped_id"'
    );
    expect(lines).toHaveLength(4);
    expect(lines.some((l) => l.startsWith(`"'=HYPERLINK(1)"`))).toBe(true);
  });
});

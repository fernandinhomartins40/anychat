import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  contact: { upsert: vi.fn(), createMany: vi.fn() },
  tag: { createMany: vi.fn(), findMany: vi.fn() },
  contactTag: { createMany: vi.fn() },
  instagramAccount: { findFirst: vi.fn() },
}));
vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }));

import { normalizeTagList, normalizeTagName } from "../lib/contacts/tags";
import {
  recordContactInteraction,
  recordContactInteractionSafely,
  recordInboundDmContactSafely,
} from "../lib/contacts/record";

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.contact.upsert.mockResolvedValue({ id: "contact_1" });
  mockPrisma.contact.createMany.mockResolvedValue({ count: 0 });
  mockPrisma.tag.findMany.mockResolvedValue([{ id: "tag_lead" }, { id: "tag_vip" }]);
});

describe("tag names", () => {
  it("trims, collapses spaces and lowercases", () => {
    expect(normalizeTagName("  Lead   Quente ")).toBe("lead quente");
  });

  it("caps the length", () => {
    expect(normalizeTagName("x".repeat(80))).toHaveLength(40);
  });

  it("drops blanks and case-insensitive duplicates, keeping order", () => {
    expect(normalizeTagList(["VIP", " ", "lead", "vip", "Lead "])).toEqual(["vip", "lead"]);
  });
});

describe("recordContactInteraction", () => {
  const at = new Date("2026-10-30T12:00:00Z");
  const base = {
    workspaceId: "ws_1",
    instagramAccountId: "acc_1",
    igsid: "igsid_1",
    source: "COMMENT" as const,
    at,
  };

  it("upserts the contact on account + igsid and refreshes the last interaction", async () => {
    await recordContactInteraction({ ...base, username: "maria" });

    expect(mockPrisma.contact.upsert).toHaveBeenCalledWith({
      where: { instagramAccountId_igsid: { instagramAccountId: "acc_1", igsid: "igsid_1" } },
      create: {
        workspaceId: "ws_1",
        instagramAccountId: "acc_1",
        igsid: "igsid_1",
        username: "maria",
        firstSeenAt: at,
        lastInteractionAt: at,
        lastSource: "COMMENT",
      },
      update: { lastInteractionAt: at, lastSource: "COMMENT", username: "maria" },
      select: { id: true },
    });
    expect(mockPrisma.tag.createMany).not.toHaveBeenCalled();
  });

  it("keeps a known username when the event has none", async () => {
    await recordContactInteraction({ ...base, username: null });

    const args = mockPrisma.contact.upsert.mock.calls[0][0];
    expect(args.update).not.toHaveProperty("username");
  });

  it("creates missing tags and links them without duplicates", async () => {
    await recordContactInteraction({ ...base, tagNames: ["Lead", "VIP", "lead"] });

    expect(mockPrisma.tag.createMany).toHaveBeenCalledWith({
      data: [
        { workspaceId: "ws_1", name: "lead" },
        { workspaceId: "ws_1", name: "vip" },
      ],
      skipDuplicates: true,
    });
    expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws_1", name: { in: ["lead", "vip"] } },
      select: { id: true },
    });
    expect(mockPrisma.contactTag.createMany).toHaveBeenCalledWith({
      data: [
        { contactId: "contact_1", tagId: "tag_lead" },
        { contactId: "contact_1", tagId: "tag_vip" },
      ],
      skipDuplicates: true,
    });
  });

  it("never throws from the safe wrapper", async () => {
    mockPrisma.contact.upsert.mockRejectedValue(new Error("db down"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(recordContactInteractionSafely(base)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe("recordInboundDmContactSafely", () => {
  it("resolves the account row and records a DM contact", async () => {
    mockPrisma.instagramAccount.findFirst.mockResolvedValue({ id: "acc_1", workspaceId: "ws_1" });

    await recordInboundDmContactSafely({ accountConnectionId: "acc_1", instagramUserId: "ig_1", senderId: "s_1" });

    expect(mockPrisma.instagramAccount.findFirst).toHaveBeenCalledWith({
      where: { instagramId: "ig_1", id: "acc_1" },
      select: { id: true, workspaceId: true },
    });
    expect(mockPrisma.contact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { instagramAccountId_igsid: { instagramAccountId: "acc_1", igsid: "s_1" } },
      })
    );
  });

  it("reports whether this DM created the contact", async () => {
    mockPrisma.instagramAccount.findFirst.mockResolvedValue({ id: "acc_1", workspaceId: "ws_1" });
    mockPrisma.contact.createMany.mockResolvedValueOnce({ count: 1 });

    await expect(
      recordInboundDmContactSafely({ instagramUserId: "ig_1", senderId: "s_new" })
    ).resolves.toEqual({ contactId: "contact_1", instagramAccountId: "acc_1", workspaceId: "ws_1", created: true });
    expect(mockPrisma.contact.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true })
    );

    await expect(
      recordInboundDmContactSafely({ instagramUserId: "ig_1", senderId: "s_new" })
    ).resolves.toMatchObject({ created: false });
  });

  it("returns null instead of throwing when the database fails", async () => {
    mockPrisma.instagramAccount.findFirst.mockRejectedValue(new Error("db down"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      recordInboundDmContactSafely({ instagramUserId: "ig_1", senderId: "s_1" })
    ).resolves.toBeNull();
    log.mockRestore();
  });

  it("does nothing for an unknown account", async () => {
    mockPrisma.instagramAccount.findFirst.mockResolvedValue(null);

    await recordInboundDmContactSafely({ instagramUserId: "ig_x", senderId: "s_1" });

    expect(mockPrisma.contact.upsert).not.toHaveBeenCalled();
  });
});

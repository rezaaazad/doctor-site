import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  count: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { contactMessage: { count: db.count, create: db.create } },
}));
vi.mock("@/lib/messaging/notify", () => ({ defer: vi.fn(), notifyLead: vi.fn() }));

import { captureLead, readLead, validateLead, type LeadInput } from "@/lib/leads";
import { defer } from "@/lib/messaging/notify";

const base: LeadInput = {
  name: "سارا محمدی",
  phone: "۰۹۱۲۳۴۵۶۷۸۹",
  email: "",
  projectType: "فروشگاه اینترنتی",
  budget: "",
  message: "",
  source: "home",
  company: "",
};

beforeEach(() => {
  db.rows = [];
  db.count.mockReset().mockImplementation(async () => db.rows.length);
  db.create.mockReset().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    const row = { id: `lead_${db.rows.length + 1}`, ...data };
    db.rows.push(row);
    return row;
  });
  vi.mocked(defer).mockClear();
});

describe("lead form validation", () => {
  it("reads and trims form fields with length caps", () => {
    const fd = new FormData();
    fd.set("name", "  علی  ");
    fd.set("message", "x".repeat(5000));
    const lead = readLead(fd);
    expect(lead.name).toBe("علی");
    expect(lead.message).toHaveLength(4000);
    expect(lead.company).toBe("");
  });

  it("accepts Persian digits and normalizes the mobile number", () => {
    const result = validateLead(base);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.phone).toBe("09123456789");
  });

  it("rejects a missing name, bad phone and bad email", () => {
    const result = validateLead({ ...base, name: "a", phone: "123", email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["email", "name", "phone"]);
  });

  it("rejects link-stuffed messages", () => {
    const message = Array.from({ length: 5 }, (_, i) => `https://spam${i}.example`).join(" ");
    expect(validateLead({ ...base, message }).ok).toBe(false);
  });
});

describe("captureLead", () => {
  it("stores a valid lead as new and schedules the notification", async () => {
    const result = await captureLead(base, "1.2.3.4");
    expect(result.ok).toBe(true);
    expect(db.create).toHaveBeenCalledOnce();
    const saved = db.create.mock.calls[0][0].data;
    expect(saved).toMatchObject({ name: "سارا محمدی", phone: "09123456789", status: "new", ip: "1.2.3.4", source: "home" });
    expect(saved.message).toContain("فروشگاه اینترنتی");
    expect(defer).toHaveBeenCalledOnce();
  });

  it("silently drops honeypot submissions", async () => {
    const result = await captureLead({ ...base, company: "bot inc" }, "1.2.3.4");
    expect(result).toMatchObject({ ok: true, spam: true });
    expect(db.create).not.toHaveBeenCalled();
  });

  it("returns field errors without touching the database", async () => {
    const result = await captureLead({ ...base, phone: "" }, "1.2.3.4");
    expect(result.ok).toBe(false);
    expect(result.errors?.phone).toBeTruthy();
    expect(db.count).not.toHaveBeenCalled();
  });

  it("rate-limits to five leads per hour per IP", async () => {
    for (let i = 0; i < 5; i++) expect((await captureLead(base, "5.5.5.5")).ok).toBe(true);
    const sixth = await captureLead(base, "5.5.5.5");
    expect(sixth.ok).toBe(false);
    expect(db.create).toHaveBeenCalledTimes(5);
  });
});

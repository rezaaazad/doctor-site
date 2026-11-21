import { hashSync } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ctx = vi.hoisted(() => ({
  headers: new Headers(),
  cookies: new Map<string, { value: string; options: Record<string, unknown> }>(),
  attempts: [] as { ip: string; createdAt: Date }[],
  sessions: [] as { userId: string; tokenHash: string; expiresAt: Date }[],
  users: [] as Record<string, unknown>[],
  activity: [] as unknown[],
}));

class RedirectSignal extends Error {
  constructor(public to: string) {
    super(`NEXT_REDIRECT ${to}`);
  }
}

vi.mock("next/headers", () => ({
  headers: async () => ctx.headers,
  cookies: async () => ({
    get: (name: string) => (ctx.cookies.has(name) ? { name, value: ctx.cookies.get(name)!.value } : undefined),
    set: (name: string, value: string, options: Record<string, unknown>) => ctx.cookies.set(name, { value, options }),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new RedirectSignal(to);
  },
}));
vi.mock("@/lib/activity", () => ({ logActivity: async (...args: unknown[]) => ctx.activity.push(args) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    loginAttempt: {
      deleteMany: async ({ where }: { where: { ip?: string; createdAt?: { lt: Date } } }) => {
        ctx.attempts = ctx.attempts.filter((a) => (where.ip ? a.ip !== where.ip : !(where.createdAt && a.createdAt < where.createdAt.lt)));
        return { count: 0 };
      },
      count: async ({ where }: { where: { ip: string; createdAt: { gte: Date } } }) =>
        ctx.attempts.filter((a) => a.ip === where.ip && a.createdAt >= where.createdAt.gte).length,
      create: async ({ data }: { data: { ip: string } }) => ctx.attempts.push({ ip: data.ip, createdAt: new Date() }),
    },
    adminUser: {
      findUnique: async ({ where }: { where: { email: string } }) => ctx.users.find((u) => u.email === where.email) ?? null,
      update: async () => ({}),
    },
    session: {
      create: async ({ data }: { data: (typeof ctx.sessions)[number] }) => ctx.sessions.push(data),
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const s = ctx.sessions.find((row) => row.tokenHash === where.tokenHash);
        const user = s && ctx.users.find((u) => u.id === s.userId);
        return s && user ? { ...s, user } : null;
      },
      deleteMany: async () => ({ count: 0 }),
      delete: async () => ({}),
    },
  },
}));

import { getSessionUser, guardAction, hashToken, safeNext, sameOrigin } from "@/lib/auth";
import { loginStaffAction } from "@/lib/actions/admin/session";
import { can, ROLES } from "@/lib/roles";

const PASSWORD = "Correct-Horse-42";
const passwordHash = hashSync(PASSWORD, 4);

function request(origin: string | null, host = "doctor-site.ir", ip = "9.9.9.9") {
  ctx.headers = new Headers({ host, "x-forwarded-for": ip, "x-forwarded-proto": "https" });
  if (origin) ctx.headers.set("origin", origin);
}

function form(email: string, password: string, next = "/admin/orders") {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  fd.set("next", next);
  return fd;
}

async function login(fd: FormData) {
  try {
    return { state: await loginStaffAction({ ok: false, message: "" }, fd), redirect: "" };
  } catch (error) {
    if (error instanceof RedirectSignal) return { state: null, redirect: error.to };
    throw error;
  }
}

beforeEach(() => {
  ctx.cookies.clear();
  ctx.attempts = [];
  ctx.sessions = [];
  ctx.activity = [];
  ctx.users = [
    { id: "u_admin", email: "admin@doctor-site.ir", name: "رضا", role: "admin", active: true, passwordHash },
    { id: "u_editor", email: "editor@doctor-site.ir", name: "مریم", role: "editor", active: true, passwordHash },
    { id: "u_off", email: "off@doctor-site.ir", name: "غیرفعال", role: "admin", active: false, passwordHash },
  ];
  request("https://doctor-site.ir");
});

describe("same-origin and redirect safety", () => {
  it("accepts only an Origin that matches Host or X-Forwarded-Host", () => {
    expect(sameOrigin(new Headers({ host: "doctor-site.ir", origin: "https://doctor-site.ir" }))).toBe(true);
    expect(sameOrigin(new Headers({ host: "app:3000", "x-forwarded-host": "doctor-site.ir", origin: "https://doctor-site.ir" }))).toBe(true);
    expect(sameOrigin(new Headers({ host: "doctor-site.ir", origin: "https://evil.example" }))).toBe(false);
    expect(sameOrigin(new Headers({ host: "doctor-site.ir" }))).toBe(false);
    expect(sameOrigin(new Headers({ host: "doctor-site.ir", origin: "null" }))).toBe(false);
  });

  it("only redirects inside /admin after login", () => {
    expect(safeNext("/admin/orders?status=processing")).toBe("/admin/orders?status=processing");
    expect(safeNext("https://evil.example")).toBe("/admin");
    expect(safeNext("//evil.example")).toBe("/admin");
    expect(safeNext("/admin/login")).toBe("/admin");
    expect(safeNext("/admin\\@evil")).toBe("/admin");
    expect(safeNext("")).toBe("/admin");
  });
});

describe("staff login", () => {
  it("logs in, sets an httpOnly secure session cookie and stores only the token hash", async () => {
    const result = await login(form("Admin@Doctor-Site.ir ", PASSWORD));
    expect(result.redirect).toBe("/admin/orders");
    const cookie = ctx.cookies.get("ds_session");
    expect(cookie?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    expect(ctx.sessions).toHaveLength(1);
    expect(ctx.sessions[0].tokenHash).toBe(hashToken(cookie!.value));
    expect(ctx.sessions[0].tokenHash).not.toBe(cookie!.value);
    expect(await getSessionUser()).toMatchObject({ id: "u_admin", role: "admin" });
  });

  it("rejects a cross-origin login without checking the password", async () => {
    request("https://evil.example");
    const result = await login(form("admin@doctor-site.ir", PASSWORD));
    expect(result.state?.ok).toBe(false);
    expect(ctx.sessions).toHaveLength(0);
    expect(ctx.attempts).toHaveLength(0);
  });

  it("rejects a wrong password, an unknown email and an inactive user with the same message", async () => {
    const messages = new Set<string>();
    for (const fd of [form("admin@doctor-site.ir", "wrong-password-1"), form("nobody@doctor-site.ir", PASSWORD), form("off@doctor-site.ir", PASSWORD)]) {
      const result = await login(fd);
      expect(result.state?.ok).toBe(false);
      messages.add(result.state!.message!);
    }
    expect(messages.size).toBe(1);
    expect(ctx.attempts).toHaveLength(3);
    expect(ctx.sessions).toHaveLength(0);
  });

  it("locks an IP out after 8 failures, even for the correct password", async () => {
    for (let i = 0; i < 8; i++) await login(form("admin@doctor-site.ir", `wrong-${i}-password`));
    const result = await login(form("admin@doctor-site.ir", PASSWORD));
    expect(result.state?.ok).toBe(false);
    expect(result.state?.message).toContain("تلاش بیش از حد");
    expect(ctx.sessions).toHaveLength(0);
    request("https://doctor-site.ir", "doctor-site.ir", "8.8.8.8");
    expect((await login(form("admin@doctor-site.ir", PASSWORD))).redirect).toBe("/admin/orders");
  });

  it("ignores an off-site next parameter", async () => {
    const result = await login(form("admin@doctor-site.ir", PASSWORD, "https://evil.example/phish"));
    expect(result.redirect).toBe("/admin");
  });
});

describe("roles and server-action guard", () => {
  it("gives the admin every capability and limits the other roles", () => {
    expect(can("admin", "manage_users")).toBe(true);
    expect(can("editor", "manage_content")).toBe(true);
    expect(can("editor", "manage_payments")).toBe(false);
    expect(can("shop_manager", "manage_orders")).toBe(true);
    expect(can("shop_manager", "manage_users")).toBe(false);
    expect(can("support", "refund_orders")).toBe(false);
    expect(can("unknown", "view_dashboard")).toBe(false);
    expect(can(null, "view_dashboard")).toBe(false);
    expect(Object.keys(ROLES).sort()).toEqual(["admin", "editor", "shop_manager", "support"]);
  });

  it("redirects anonymous calls to the login page", async () => {
    await expect(guardAction("manage_content")).rejects.toThrow(RedirectSignal);
  });

  it("blocks a role without the capability and a cross-origin call", async () => {
    await login(form("editor@doctor-site.ir", PASSWORD));
    await expect(guardAction("manage_content")).resolves.toMatchObject({ role: "editor" });
    await expect(guardAction("manage_payments")).rejects.toThrow("دسترسی");
    request("https://evil.example");
    await expect(guardAction("manage_content")).rejects.toThrow();
  });
});

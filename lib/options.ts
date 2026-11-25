import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GROUP_BY_ID, OPTION_GROUPS, secretKeys, withDefaults, type OptionRecord } from "@/lib/options-schema";

export type Options = Record<string, OptionRecord>;

let memo: { at: number; value: Options } | null = null;
const TTL_MS = 5_000;

function paymentDefaults(id:string,raw:unknown) {
  if (!["pay_zarinpal","pay_torobpay","pay_snapppay"].includes(id)) return withDefaults(id,raw);
  const values = {...(raw && typeof raw==="object" && !Array.isArray(raw) ? raw : {})} as Record<string,unknown>;
  for (const key of ["enabled","merchantId","sandbox","mode","baseUrl","stageBaseUrl","clientId","clientSecret","username","password"]) {
    const envKey=(id.slice(4)+"_"+key.replace(/[A-Z]/g,ch=>"_"+ch)).toUpperCase();
    const value=process.env[envKey];
    if (value && (values[key]===undefined || values[key]==="" || values[key]===null)) values[key]=["enabled","sandbox"].includes(key)?["true","1"].includes(value):value;
  }
  return withDefaults(id,values);
}
async function loadAll(): Promise<Options> {
  if (memo && Date.now() - memo.at < TTL_MS) return memo.value;
  const rows = await prisma.option.findMany();
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const value: Options = {};
  for (const group of OPTION_GROUPS) value[group.id] = paymentDefaults(group.id, byKey.get(group.id));
  memo = { at: Date.now(), value };
  return value;
}

export const getOptions = cache(async (): Promise<Options> => {
  try {
    return await loadAll();
  } catch (error) {
    console.error("options unavailable", error);
    const fallback: Options = {};
    for (const group of OPTION_GROUPS) fallback[group.id] = withDefaults(group.id, {});
    return fallback;
  }
});

export async function getGroup<T extends OptionRecord = OptionRecord>(groupId: string): Promise<T> {
  const all = await getOptions();
  return (all[groupId] ?? withDefaults(groupId, {})) as T;
}

export function invalidateOptions() {
  memo = null;
}

/** Writes a group. Empty secret fields keep the stored value so the admin never has to re-type them. */
export async function saveGroup(groupId: string, input: Record<string, unknown>) {
  if (!GROUP_BY_ID[groupId]) throw new Error(`unknown option group ${groupId}`);
  const existing = await prisma.option.findUnique({ where: { key: groupId } });
  const current = withDefaults(groupId, existing?.value);
  const merged: Record<string, unknown> = { ...current, ...input };
  for (const key of secretKeys(groupId)) {
    if (input[key] === undefined || input[key] === "") merged[key] = current[key];
    if (input[key] === "__clear__") merged[key] = "";
  }
  const value = withDefaults(groupId, merged);
  await prisma.option.upsert({
    where: { key: groupId },
    create: { key: groupId, value: value as Prisma.InputJsonValue },
    update: { value: value as Prisma.InputJsonValue },
  });
  invalidateOptions();
  return value;
}

/** Seeds only groups that do not exist yet. */
export async function ensureOptionDefaults() {
  const rows = await prisma.option.findMany({ select: { key: true } });
  const have = new Set(rows.map((row) => row.key));
  for (const group of OPTION_GROUPS) {
    if (have.has(group.id)) continue;
    await prisma.option.create({ data: { key: group.id, value: withDefaults(group.id, {}) as Prisma.InputJsonValue } });
  }
  invalidateOptions();
}

export function maskSecrets(groupId: string, values: OptionRecord): OptionRecord {
  const out = { ...values };
  for (const key of secretKeys(groupId)) out[key] = values[key] ? "__set__" : "";
  return out;
}

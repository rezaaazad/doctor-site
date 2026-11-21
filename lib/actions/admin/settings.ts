"use server";

import { GROUP_BY_ID } from "@/lib/options-schema";
import { saveGroup } from "@/lib/options";
import type { Capability } from "@/lib/roles";
import { adminRun, FieldError, type AdminState } from "@/lib/admin/action";
import { toLatinDigits } from "@/lib/money";

/** Generic save for any option group; fields are read and coerced from the registry definition. */
export async function saveOptionGroupAction(groupId: string, _prev: AdminState, formData: FormData): Promise<AdminState> {
  const group = GROUP_BY_ID[groupId];
  if (!group) return { ok: false, message: "گروه تنظیمات ناشناخته است." };
  return adminRun(
    group.cap as Capability,
    async () => {
      const input: Record<string, unknown> = {};
      for (const f of group.fields) {
        if (f.type === "boolean") {
          const all = formData.getAll(f.key).map(String);
          if (all.length) input[f.key] = all.includes("1") || all.includes("on");
          continue;
        }
        const raw = formData.get(f.key);
        if (raw === null) continue;
        const value = String(raw);
        if (f.type === "secret") {
          if (value === "__set__") continue;
          input[f.key] = value.trim();
          continue;
        }
        if (f.type === "number" || f.type === "toman") {
          const n = Number(toLatinDigits(value).replace(/[,٬\s]/g, ""));
          if (!Number.isFinite(n)) throw new FieldError(f.key, `«${f.label}» باید عدد باشد.`);
          if (f.max !== undefined && n > f.max) throw new FieldError(f.key, `«${f.label}» حداکثر ${f.max} است.`);
          input[f.key] = n;
          continue;
        }
        if (f.type === "color" && value && !/^#[0-9a-fA-F]{6}$/.test(value.trim())) throw new FieldError(f.key, "رنگ باید به شکل #RRGGBB باشد.");
        if (f.type === "select" && f.choices && !f.choices.some((c) => c.value === value)) throw new FieldError(f.key, "گزینه نامعتبر است.");
        input[f.key] = f.type === "code" || f.type === "textarea" ? value : value.trim();
      }
      await saveGroup(groupId, input);
      return `«${group.label}» ذخیره شد.`;
    },
    { log: { action: "update", entity: "settings", entityId: groupId, summary: group.label } },
  );
}

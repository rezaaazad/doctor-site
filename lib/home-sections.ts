import { mergeContent, sectionDef, str } from "@/lib/sections";

export type HomeSectionInput = {
  id: string;
  page: string;
  key: string;
  sortOrder: number;
  visible: boolean;
  content: Record<string, unknown>;
};

export type HomeSectionRow = {
  id: string;
  key: string;
  sortOrder: number;
  content: Record<string, unknown>;
};

/** Visible home sections. A hidden pricingPlans row must not hide a visible legacy pricing row. */
export function selectHomeSections(sections: HomeSectionInput[]): HomeSectionRow[] {
  const home = sections.filter((section) => section.page === "home");
  const plans = home.find((section) => section.key === "pricingPlans");
  const legacy = home.find((section) => section.key === "pricing");
  const rows = home
    .filter((section) => section.visible && section.key !== "pricing" && section.key !== "pricingPlans" && sectionDef("home", section.key))
    .map((section) => ({
      id: section.id,
      key: section.key,
      sortOrder: section.sortOrder,
      content: mergeContent(sectionDef("home", section.key), section.content),
    }));
  const source = plans?.visible ? plans : legacy?.visible ? legacy : null;
  if (source) {
    const stored = plans?.visible
      ? plans.content
      : {
          ...(plans?.content ?? {}),
          ...(legacy?.content ?? {}),
          eyebrow: str(legacy?.content.eyebrow) || str(legacy?.content.kicker) || str(plans?.content.eyebrow),
        };
    rows.push({
      id: source.id,
      key: "pricingPlans",
      sortOrder: source.sortOrder,
      content: mergeContent(sectionDef("home", "pricingPlans"), stored),
    });
  }
  return rows.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function homePricingContent(sections: HomeSectionInput[]) {
  return selectHomeSections(sections).find((section) => section.key === "pricingPlans")?.content;
}

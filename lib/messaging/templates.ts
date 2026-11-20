export function renderTemplate(template: string, vars: Record<string, string | number | undefined | null>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? "" : String(value);
  }).replace(/\n{3,}/g, "\n\n").trim();
}

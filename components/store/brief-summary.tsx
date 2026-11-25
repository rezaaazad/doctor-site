import { asObject } from "@/lib/utils";

export function briefRows(brief: unknown) {
  const answers = asObject(brief).answers;
  if (!Array.isArray(answers)) return [];
  return answers.flatMap((row, index) => {
    const item = asObject(row);
    const title = typeof item.title === "string" ? item.title : "";
    const value = typeof item.value === "string" ? item.value : "";
    if (!title && !value) return [];
    const id = typeof item.id === "string" && item.id ? item.id : String(index);
    return [{ id: `${id}-${index}`, title, value }];
  });
}

export function BriefSummary({ brief }: { brief: unknown }) {
  const answers = briefRows(brief);
  if (!answers.length) return null;
  return (
    <dl>
      {answers.map((row) => (
        <div className="my-2" key={row.id}>
          <dt className="font-bold">{row.title}</dt>
          <dd className="whitespace-pre-line">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

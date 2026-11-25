import { submitBrief } from "@/lib/actions/project";
import { stages, questions } from "@/lib/store/project";
import { asObject } from "@/lib/utils";
export function BriefSummary({ brief }: { brief: unknown }) {
  const answers = asObject(brief).answers;
  return Array.isArray(answers) ? (
    <dl>
      {answers.map((row) => (
        <div className="my-2" key={row.id}>
          <dt className="font-bold">{row.title}</dt>
          <dd className="whitespace-pre-line">{row.value}</dd>
        </div>
      ))}
    </dl>
  ) : null;
}
export function ProjectBrief({
  order,
  accessKey = "",
}: {
  order: {
    number: number;
    paymentStatus: string;
    projectStage: string;
    projectBrief: unknown;
    items: Parameters<typeof questions>[0];
  };
  accessKey?: string;
}) {
  if (
    order.paymentStatus !== "paid" ||
    !order.items.some((i) => i.type === "service")
  )
    return null;
  return (
    <section className="card grid gap-4 p-5 text-start">
      <h2 className="font-bold">پروژه شما</h2>
      <ol className="grid gap-2 sm:grid-cols-5">
        {Object.entries(stages).map(([id, label]) => (
          <li
            key={id}
            aria-current={order.projectStage === id ? "step" : undefined}
            className="rounded-xl bg-sunken p-2 aria-[current=step]:bg-primary-soft"
          >
            {label}
          </li>
        ))}
      </ol>
      {order.projectStage === "awaiting_brief" ? (
        <form
          className="grid gap-3"
          action={submitBrief.bind(null, order.number, accessKey)}
        >
          {questions(order.items).map((q) => (
            <label key={q.id}>
              {q.title}
              {q.required ? " *" : ""}
              <textarea
                className="field w-full"
                name={q.id}
                required={q.required}
                maxLength={2000}
              />
            </label>
          ))}
          <button className="btn btn-primary">ثبت بریف و شروع پروژه</button>
        </form>
      ) : (
        <BriefSummary brief={order.projectBrief} />
      )}
    </section>
  );
}

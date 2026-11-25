import { BriefForm } from "@/components/store/brief-form";
import { BriefSummary } from "@/components/store/brief-summary";
import { questions, stages } from "@/lib/store/project";

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
  if (order.paymentStatus !== "paid" || !order.items.some((item) => item.type === "service")) return null;
  return (
    <section className="card grid gap-4 p-5 text-start">
      <h2 className="font-bold">پروژه شما</h2>
      <ol className="grid gap-2 sm:grid-cols-5">
        {Object.entries(stages).map(([id, label]) => (
          <li key={id} aria-current={order.projectStage === id ? "step" : undefined} className="rounded-xl bg-sunken p-2 aria-[current=step]:bg-primary-soft">
            {label}
          </li>
        ))}
      </ol>
      {order.projectStage === "awaiting_brief" ? (
        <BriefForm number={order.number} accessKey={accessKey} fields={questions(order.items)} />
      ) : (
        <BriefSummary brief={order.projectBrief} />
      )}
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ActionForm, RowsField, MediaField } from "./forms";
import { asStringArray, asObject } from "@/lib/utils";
import { readSpecs, readOptions } from "@/lib/store/catalog";
import { readAddons } from "@/lib/store/addons";
import { saveStudio } from "@/lib/actions/admin/studio";
import { BlockEditor } from "./block-editor";
import { VariantEditor } from "./variant-editor";
export async function Studio({
  id,
  preset = "service",
}: {
  id?: string;
  preset?: string;
}) {
  await requireStaff("manage_store");
  const [p, categories] = await Promise.all([
    id
      ? prisma.storeProduct.findUnique({
          where: { id },
          include: { variants: { orderBy: { sortOrder: "asc" } } },
        })
      : null,
    prisma.storeCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (id && !p) notFound();
  const type = p?.type || preset;
  const images = asStringArray(p?.images);
  const input = (
    name: string,
    label: string,
    value: unknown = "",
    kind = "text",
  ) => (
    <label className="grid gap-1" key={name}>
      {label}
      <input
        className="input"
        type={kind}
        name={name}
        defaultValue={String(value ?? "")}
        required={["title", "price"].includes(name)}
      />
    </label>
  );
  const area = (name: string, label: string, value: unknown) => (
    <label className="grid gap-1">
      {label}
      <textarea
        className="input"
        name={name}
        defaultValue={String(value ?? "")}
      />
    </label>
  );
  const flag = (name: string, label: string, on: boolean) => (
    <label>
      <input type="checkbox" name={name} defaultChecked={on} /> {label}
    </label>
  );
  const group = (label: string, children: React.ReactNode) => (
    <fieldset className="card grid gap-4 p-5 sm:grid-cols-2">
      <legend className="font-bold">{label}</legend>
      {children}
    </fieldset>
  );
  const required = {
    key: "required" as const,
    label: "الزامی",
    type: "select" as const,
    options: [
      { value: "", label: "اختیاری" },
      { value: "yes", label: "الزامی" },
    ],
  };
  const opts = readOptions(p?.options);
  const axes = opts.length
    ? opts.map((o) => o.name)
    : [type === "service" ? "سطح پکیج" : "مجوز"];
  const rows = p
    ? p.variants.map((v) => ({
        id: v.id,
        title: v.title,
        price: String(v.priceRial / BigInt(10)),
        compareAt: v.compareAtRial ? String(v.compareAtRial / BigInt(10)) : "",
        sku: v.sku,
        imageUrl: v.imageUrl,
        active: v.active ? "yes" : "no",
        ...Object.fromEntries(
          axes.map((a, i) => [
            "axis" + i,
            String(asObject(v.values)[a] ?? v.title),
          ]),
        ),
      }))
    : (type === "service"
        ? ["پایه", "حرفه‌ای", "اختصاصی"]
        : ["تک‌دامنه", "نامحدود"]
      ).map((title) => ({ title, axis0: title, price: "" }));
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">
        {p?.title || "افزودن محصول جدید"}
      </h1>
      {!p && (
        <nav className="mb-4 flex gap-2">
          <Link className="btn btn-outline" href="?type=service">
            پکیج طراحی سایت (خدمت)
          </Link>
          <Link className="btn btn-outline" href="?type=digital">
            قالب / محصول دیجیتال
          </Link>
        </nav>
      )}
      <ActionForm key={id || preset} action={saveStudio.bind(null, id || "")}>
        {group(
          "معرفی محصول",
          <>
            {input("title", "عنوان", p?.title)}
            {input("slug", "نامک (پیش‌فرض از عنوان)", p?.slug)}
            <label>
              دسته
              <select
                className="input"
                name="categoryId"
                defaultValue={p?.categoryId}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              نوع
              <select className="input" name="type" defaultValue={type}>
                <option value="service">خدمت</option>
                <option value="digital">دیجیتال</option>
              </select>
            </label>
            {input("subtitle", "زیرعنوان", p?.subtitle)}
            {input("brand", "برند", p?.brand)}
            {area("summary", "خلاصه", p?.summary)}
            {area("description", "توضیحات", p?.description)}
            {input("turnaroundLabel", "زمان تحویل", p?.turnaroundLabel)}
            {input("badge", "نشان محصول", p?.badge)}
            {input("guarantee", "ضمانت و دوره پشتیبانی", p?.guarantee)}
            {area(
              "tags",
              "برچسب‌ها (هر خط یک مورد)",
              asStringArray(p?.tags).join("\n"),
            )}
            {flag("published", "انتشار", !!p?.published)}
            {flag("featured", "ویژه", !!p?.featured)}
          </>,
        )}
        {group(
          "قیمت و فروش",
          <>
            {input(
              "price",
              "قیمت (تومان)",
              p ? String(p.priceRial / BigInt(10)) : "",
              "number",
            )}
            {input(
              "compareAt",
              "قیمت پیش از تخفیف (تومان)",
              p?.compareAtRial ? String(p.compareAtRial / BigInt(10)) : "",
              "number",
            )}
            {input(
              "saleEndsAt",
              "پایان تخفیف (UTC)",
              p?.saleEndsAt?.toISOString().slice(0, 16),
              "datetime-local",
            )}
            {input("sku", "شناسه محصول", p?.sku)}
            {input(
              "maxPerOrder",
              "سقف تعداد سفارش",
              p?.maxPerOrder || 0,
              "number",
            )}
            {input("sortOrder", "ترتیب نمایش", p?.sortOrder || 0, "number")}
            {flag("installments", "پرداخت اقساطی", p?.installments ?? true)}
            {flag("torobEnabled", "نمایش در ترب", p?.torobEnabled ?? true)}
            {flag("snappEnabled", "نمایش در اسنپ", p?.snappEnabled ?? true)}
          </>,
        )}
        {group(
          "رسانه",
          <>
            <MediaField
              name="cover"
              label="تصویر شاخص"
              defaultValue={images[0]}
            />
            {area(
              "gallery",
              "گالری (هر خط یک نشانی)",
              images.slice(1).join("\n"),
            )}
          </>,
        )}
        {group(
          "مجوز و تحویل دیجیتال",
          <>
            {input("licenseNote", "شرایط مجوز و به‌روزرسانی", p?.licenseNote)}
            {input("downloadUrl", "نشانی دانلود", p?.downloadUrl)}
            <MediaField
              privateFile
              name="downloadMedia"
              label="فایل خصوصی دانلود"
              accept=".zip,.pdf"
              defaultValue={p?.downloadMedia ? "media:" + p.downloadMedia : ""}
            />
            {input(
              "downloadLimit",
              "دفعات دانلود",
              p?.downloadLimit ?? 5,
              "number",
            )}
            {input(
              "downloadDays",
              "مهلت دانلود (روز)",
              p?.downloadDays ?? 30,
              "number",
            )}
          </>,
        )}
        <details className="card p-4">
          <summary>محتوای تکمیلی محصول</summary>
          <BlockEditor initial={p?.blocks} body="" />
        </details>
        {group(
          "سئو",
          <>
            {input("seoTitle", "عنوان سئو", p?.seoTitle)}
            {area("seoDescription", "توضیحات سئو", p?.seoDescription)}
          </>,
        )}
        {p && (
          <details className="card p-4">
            <summary>اطلاعات سیستمی محصول</summary>
            <p>
              کد محصول: {p.code} · دفعات فروش: {p.salesCount} · میانگین امتیاز:{" "}
              {p.ratingAvg} از {p.ratingCount} نظر
            </p>
            <p>
              تاریخ ایجاد: {p.createdAt.toLocaleDateString("fa-IR")} · آخرین
              تغییر: {p.updatedAt.toLocaleDateString("fa-IR")}
            </p>
          </details>
        )}
        <VariantEditor axes={axes} rows={rows} />
        <RowsField
          label="خدمات تکمیلی"
          name="addons"
          columns={[
            { key: "title", label: "عنوان" },
            { key: "description", label: "توضیح" },
            { key: "price", label: "تومان" },
            required,
          ]}
          defaultValue={readAddons(p?.addons).map((a) => ({
            ...a,
            price: String(BigInt(a.priceRial) / BigInt(10)),
            required: a.required ? "yes" : "",
          }))}
        />
        <RowsField
          label="پرسش‌های بریف"
          name="briefSchema"
          columns={[{ key: "title", label: "پرسش" }, required]}
          defaultValue={
            Array.isArray(p?.briefSchema)
              ? p.briefSchema.map((value) => {
                  const q = asObject(value);
                  return {
                    id: String(q.id),
                    title: String(q.title),
                    required: q.required ? "yes" : "",
                  };
                })
              : []
          }
        />
        <RowsField
          label="مشخصات"
          name="specs"
          columns={[
            { key: "name", label: "ویژگی" },
            { key: "value", label: "مقدار" },
          ]}
          defaultValue={readSpecs(p?.specs)}
        />
        <button className="btn btn-primary">ذخیره محصول</button>
      </ActionForm>
    </>
  );
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "دکتر سایت",
    short_name: "دکتر سایت",
    description: "استودیوی طراحی و مهندسی وب",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F7F2",
    theme_color: "#075D60",
    lang: "fa",
    dir: "rtl",
  };
}

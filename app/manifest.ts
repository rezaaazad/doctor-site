import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "دکتر سایت",
    short_name: "دکتر سایت",
    description: "استودیوی طراحی و مهندسی وب",
    start_url: "/",
    display: "standalone",
    background_color: "#070708",
    theme_color: "#070708",
    lang: "fa",
    dir: "rtl",
  };
}

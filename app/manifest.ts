import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Warmfly Expenses",
    short_name: "Warmfly",
    description: "Server-rendered Firefly III expenses, optimized for quick review.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c12",
    theme_color: "#0b0f1a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

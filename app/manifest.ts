import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rakexura Store",
    short_name: "Rakexura",
    description: "Premium PC games and trackable digital delivery.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070f",
    theme_color: "#05070f",
    icons: [
      {
        src: "/Assets/RakeLogo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/Assets/RakeLogo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/Assets/RakeLogo.png",
        sizes: "any",
        type: "image/png"
      }
    ]
  };
}

import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Rakexura Store", short_name: "Rakexura", description: "Premium PC games and trackable digital delivery.", start_url: "/", display: "standalone", background_color: "#05070f", theme_color: "#05070f", icons: [{ src: "/Assets/RakeBadge.png", sizes: "96x96", type: "image/png" }] }; }

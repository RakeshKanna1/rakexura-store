export type Platform = "Steam" | "Epic" | "Offline" | "Online" | "Xbox" | "Nvidia GeForce";

export interface Game {
  id: number;
  title: string;
  slug?: string | null;
  tagline?: string | null;
  description?: string | null;
  long_description?: string | null;
  cover_image?: string | null;
  banner_image?: string | null;
  trailer_url?: string | null;
  screenshots?: string[] | null;
  genres?: string[] | null;
  tags?: string[] | null;
  features?: string[] | null;
  key_features?: string[] | null;
  minimum_requirements?: string | null;
  recommended_requirements?: string | null;
  activation_instructions?: string | null;
  activation_slots?: number | null;
  developer?: string | null;
  publisher?: string | null;
  release_date?: string | null;
  rating?: number | null;
  steam_price?: number | null;
  epic_price?: number | null;
  offline_price?: number | null;
  online_price?: number | null;
  xbox_price?: number | null;
  geforce_price?: number | null;
  duration?: string | null;
  original_price?: number | null;
  sale_price?: number | null;
  available_platforms?: Platform[] | null;
  featured?: boolean | null;
  featured_deal?: boolean | null;
  show_in_hero?: boolean | null;
  show_in_featured?: boolean | null;
  show_in_trending?: boolean | null;
  show_in_recommended?: boolean | null;
  offer_enabled?: boolean | null;
  offer_end_date?: string | null;
  archived?: boolean | null;
  preorder?: boolean | null;
  is_subscription?: boolean | null;
  online_activation?: boolean | null;
  is_premium?: boolean | null;
  premium_theme?: string | null;
  out_of_stock?: boolean | null;
}

export interface Bundle {
  id: number;
  title: string;
  description?: string | null;
  cover_image?: string | null;
  original_price: number;
  bundle_price: number;
  active: boolean;
  bundle_games?: Array<{ games: Pick<Game, "id" | "title"> | null }>;
  offer_end_date?: string | null;
}

export interface CartLine {
  game: Game;
  platform: Platform;
  quantity: number;
}

export interface BundleCartLine {
  bundle: Bundle;
  quantity: number;
}

export interface Review {
  id: number;
  game_id: number;
  customer_name: string;
  rating: number;
  message?: string | null;
  created_at: string;
  verified_purchase?: boolean;
  games?: Pick<Game, "title"> | null;
}

export interface FlashSale {
  id: number;
  game_id: number;
  sale_price: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
  games: Game | null;
}

export interface RecentDelivery {
  id: number;
  game_title: string;
  public_label: string;
  delivered_at: string;
}

export interface CustomerProof {
  id: number;
  image_url: string;
  caption?: string | null;
  proof_type: "whatsapp" | "payment" | "testimonial";
  created_at: string;
}

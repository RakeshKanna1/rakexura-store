"use client";

import { Heart } from "lucide-react";
import type { Game } from "@/types/store";
import { useCartStore } from "@/stores/cart-store";
import { GameCard } from "@/components/store/game-card";
import { EmptyState } from "@/components/common/empty-state";

export function WishlistView({ games }: { games: Game[] }) {
  const ids = useCartStore((state) => state.wishlistIds);
  const saved = games.filter((game) => ids.includes(game.id));
  if (!saved.length) return <EmptyState icon={Heart} title="Your wishlist is empty" message="Save games you want to revisit and find them here on any signed-in device." href="/games" action="Explore games" />;
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{saved.map((game) => <GameCard key={game.id} game={game} />)}</div>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { Game } from "@/types/store";
import { GameShelf } from "./game-shelf";

const KEY = "rakexura-recently-viewed";

export function RecentlyViewedTracker({ gameId }: { gameId: number }) {
  useEffect(() => {
    const current = JSON.parse(localStorage.getItem(KEY) || "[]") as number[];
    localStorage.setItem(KEY, JSON.stringify([gameId, ...current.filter((id) => id !== gameId)].slice(0, 12)));
  }, [gameId]);
  return null;
}

export function RecentlyViewedShelf({ games }: { games: Game[] }) {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => { setIds(JSON.parse(localStorage.getItem(KEY) || "[]") as number[]); }, []);
  const viewed = useMemo(() => ids.map((id) => games.find((game) => game.id === id)).filter((game): game is Game => Boolean(game)), [games, ids]);
  return viewed.length ? <GameShelf title="Recently viewed" subtitle="Pick up where you left off" games={viewed} /> : null;
}

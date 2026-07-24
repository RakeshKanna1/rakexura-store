"use client";

import { useEffect, useMemo, useState } from "react";
import type { Game } from "@/types/store";
import { GameShelf } from "./game-shelf";

const KEY = "rakexura-recently-viewed";

export function RecentlyViewedTracker({ gameId }: { gameId: number }) {
  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem(KEY) || "[]") as number[];
      const validCurrent = Array.isArray(current) ? current : [];
      localStorage.setItem(KEY, JSON.stringify([gameId, ...validCurrent.filter((id) => id !== gameId)].slice(0, 12)));
    } catch {
      localStorage.setItem(KEY, JSON.stringify([gameId]));
    }
  }, [gameId]);
  return null;
}

export function RecentlyViewedShelf({ games }: { games: Game[] }) {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as number[];
      if (Array.isArray(parsed)) setIds(parsed);
    } catch {
      setIds([]);
    }
  }, []);
  const viewed = useMemo(() => ids.map((id) => games.find((game) => game.id === id)).filter((game): game is Game => Boolean(game)), [games, ids]);
  return viewed.length ? <GameShelf title="Recently viewed" subtitle="Pick up where you left off" games={viewed} /> : null;
}

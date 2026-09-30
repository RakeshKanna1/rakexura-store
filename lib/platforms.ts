import type { Game, Platform } from "@/types/store";

/**
 * Returns available platforms for a game, expanding standard PC games
 * to Steam (Offline) / Steam (Online) according to delivery and pricing.
 * Safe to call from both Server and Client Components.
 */
export function getGamePlatforms(game: Game): Platform[] {
  if (game.is_subscription) {
    const raw = (game.available_platforms ?? []).filter(Boolean) as Platform[];
    const subOnly = raw.filter((p) => p.includes("Month") || p.includes("Year") || p.includes("Days"));
    if (subOnly.length) return subOnly;

    const subPlans: Array<[Platform, unknown]> = [
      ["1 Month", game.price_1m ?? game.xbox_price ?? game.steam_price],
      ["2 Months", game.price_2m],
      ["3 Months", game.price_3m],
      ["6 Months", game.price_6m],
      ["12 Months", game.price_12m],
    ];
    const subListed = subPlans.filter(([, value]) => Number(value ?? 0) > 0).map(([platform]) => platform);
    if (subListed.length) return subListed;
    return ["1 Month"];
  }

  const custom = (game.available_platforms ?? []).filter(Boolean) as Platform[];
  if (custom.length) {
    const expanded: Platform[] = [];
    for (const p of custom) {
      if (p === "Steam") {
        if (Number(game.online_price ?? 0) > 0 || game.online_activation) {
          if (Number(game.offline_price ?? 0) > 0 || Number(game.steam_price ?? 0) > 0) {
            expanded.push("Steam (Offline)");
            expanded.push("Steam (Online)");
          } else {
            expanded.push("Steam (Online)");
          }
        } else {
          expanded.push("Steam (Offline)");
        }
      } else if (p === "Epic") {
        if (Number(game.online_price ?? 0) > 0 || game.online_activation) {
          if (Number(game.offline_price ?? 0) > 0 || Number(game.epic_price ?? 0) > 0) {
            expanded.push("Epic (Offline)");
            expanded.push("Epic (Online)");
          } else {
            expanded.push("Epic (Online)");
          }
        } else {
          expanded.push("Epic (Offline)");
        }
      } else if (p === "Ubisoft") {
        if (Number(game.online_price ?? 0) > 0) {
          if (Number(game.offline_price ?? 0) > 0 || Number(game.ubisoft_price ?? 0) > 0) {
            expanded.push("Ubisoft (Offline)");
            expanded.push("Ubisoft (Online)");
          } else {
            expanded.push("Ubisoft (Online)");
          }
        } else {
          expanded.push("Ubisoft (Offline)");
        }
      } else if (p === "Offline") {
        expanded.push("Steam (Offline)");
      } else if (p === "Online") {
        expanded.push("Steam (Online)");
      } else {
        expanded.push(p);
      }
    }
    const unique = Array.from(new Set(expanded));
    if (unique.length) return unique;
  }

  const legacy: Array<[Platform, unknown]> = [
    ["Steam (Offline)", game.offline_price ?? game.steam_price],
    ["Steam (Online)", game.online_price],
    ["Epic (Offline)", game.epic_price],
    ["Xbox", game.xbox_price],
    ["Nvidia GeForce", game.geforce_price],
  ];
  const listed = legacy.filter(([, value]) => Number(value ?? 0) > 0).map(([platform]) => platform);
  if (listed.length) return listed;
  return ["Steam (Offline)"];
}

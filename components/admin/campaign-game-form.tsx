import { Percent } from "lucide-react";
import Link from "next/link";
import { saveCampaignGame } from "@/app/admin/actions";

const input = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#facc15]";

type CampaignGameValue = {
  id: number;
  campaign_id: number;
  game_id: number;
  campaign_price: number;
  stock_limit: number | null;
};

type SimpleCampaign = { id: number; name: string };
type SimpleGame = { id: number; title: string };

export function CampaignGameForm({ 
  campaignGame, 
  campaigns, 
  games 
}: { 
  campaignGame?: CampaignGameValue | null; 
  campaigns: SimpleCampaign[]; 
  games: SimpleGame[]; 
}) {
  return (
    <form key={campaignGame?.id ?? "new"} action={saveCampaignGame} className="premium-panel mt-8 rounded-md p-5 md:p-7">
      {campaignGame && <input type="hidden" name="id" value={campaignGame.id} />}
      <p className="eyebrow">Price Overrides</p>
      <h2 className="mt-2 text-2xl font-black">{campaignGame ? "Edit Override Price" : "Add Override Price"}</h2>
      
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col text-sm font-bold">
          <span>Active Campaign</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Select the sale campaign this override belongs to.
          </span>
          <select name="campaign_id" required defaultValue={campaignGame?.campaign_id ?? ""} className={input}>
            <option value="" disabled>Select a campaign...</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm font-bold">
          <span>Game</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Select the game you want to place on sale.
          </span>
          <select name="game_id" required defaultValue={campaignGame?.game_id ?? ""} className={input}>
            <option value="" disabled>Select a game...</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm font-bold">
          <span>Override Price (Rs.)</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Discounted price during the campaign event.
          </span>
          <input name="campaign_price" type="number" min="0" required defaultValue={campaignGame?.campaign_price} className={input} />
        </label>

        <label className="flex flex-col text-sm font-bold">
          <span>Stock Limit (Optional)</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Maximum number of keys available for this deal.
          </span>
          <input name="stock_limit" type="number" min="1" placeholder="Unlimited" defaultValue={campaignGame?.stock_limit ?? ""} className={input} />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn btn-primary">
          <Percent size={17} /> {campaignGame ? "Save Override" : "Add Override"}
        </button>
        {campaignGame && (
          <Link href="/admin/campaign-games" className="btn btn-secondary">
            Cancel edit
          </Link>
        )}
      </div>
    </form>
  );
}

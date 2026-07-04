import { Zap } from "lucide-react";
import Link from "next/link";
import { saveFlashSale } from "@/app/admin/actions";

const input = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#facc15]";

type FlashSaleValue = { 
  id: number; 
  game_id: number; 
  sale_price: number; 
  starts_at: string; 
  ends_at: string; 
  active: boolean; 
};

type SimpleGame = {
  id: number;
  title: string;
};

export function FlashSaleForm({ flashSale, games }: { flashSale?: FlashSaleValue | null; games: SimpleGame[] }) {
  const starts = flashSale?.starts_at ? new Date(flashSale.starts_at).toISOString().slice(0, 16) : "";
  const ends = flashSale?.ends_at ? new Date(flashSale.ends_at).toISOString().slice(0, 16) : "";

  return (
    <form key={flashSale?.id ?? "new"} action={saveFlashSale} className="premium-panel mt-8 rounded-md p-5 md:p-7">
      {flashSale && <input type="hidden" name="id" value={flashSale.id} />}
      <p className="eyebrow">Timed Deals</p>
      <h2 className="mt-2 text-2xl font-black">{flashSale ? "Edit flash sale" : "Create flash sale"}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        
        <label className="flex flex-col text-sm font-bold">
          <span>Game</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Select the game you want to place on flash sale.
          </span>
          <select name="game_id" required defaultValue={flashSale?.game_id ?? ""} className={input}>
            <option value="" disabled>Select a game...</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </label>
        
        <label className="flex flex-col text-sm font-bold">
          <span>Sale Price (Rs.)</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            The temporary discounted price displayed on the storefront.
          </span>
          <input name="sale_price" type="number" min="0" required defaultValue={flashSale?.sale_price} className={input} />
        </label>
        
        <label className="flex flex-col text-sm font-bold">
          <span>Starts at</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Date and time when the sale and countdown will become active.
          </span>
          <input name="starts_at" type="datetime-local" required defaultValue={starts} className={input} />
        </label>
        
        <label className="flex flex-col text-sm font-bold">
          <span>Ends at</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Date and time when the sale will automatically end.
          </span>
          <input name="ends_at" type="datetime-local" required defaultValue={ends} className={input} />
        </label>

        <label className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 mt-auto text-sm cursor-pointer select-none">
          <input 
            type="checkbox" 
            name="active" 
            defaultChecked={flashSale ? Boolean(flashSale.active) : true} 
            className="cursor-pointer"
          />
          <span>Active</span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn btn-primary">
          <Zap size={17} /> {flashSale ? "Save changes" : "Create flash sale"}
        </button>
        {flashSale && (
          <Link href="/admin/flash-sales" className="btn btn-secondary">
            Cancel edit
          </Link>
        )}
      </div>
    </form>
  );
}

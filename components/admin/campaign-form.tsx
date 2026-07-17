import { CalendarRange } from "lucide-react";
import Link from "next/link";
import { saveCampaign } from "@/app/admin/actions";

const input = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#facc15]";

type CampaignValue = {
  id: number;
  name: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  theme_color: string;
  banner_image: string | null;
  active: boolean;
};

export function CampaignForm({ campaign }: { campaign?: CampaignValue | null }) {
  const starts = campaign?.starts_at ? new Date(campaign.starts_at).toISOString().slice(0, 16) : "";
  const ends = campaign?.ends_at ? new Date(campaign.ends_at).toISOString().slice(0, 16) : "";

  return (
    <form key={campaign?.id ?? "new"} action={saveCampaign} className="premium-panel mt-8 rounded-md p-5 md:p-7">
      {campaign && <input type="hidden" name="id" value={campaign.id} />}
      <p className="eyebrow">Seasonal Sales</p>
      <h2 className="mt-2 text-2xl font-black">{campaign ? "Edit Campaign" : "Create Campaign"}</h2>
      
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col text-sm font-bold">
          <span>Campaign Name</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Title of the sale event (e.g., Summer Sale 2026).
          </span>
          <input name="name" type="text" required defaultValue={campaign?.name} placeholder="Summer Sale" className={input} />
        </label>

        <label className="flex flex-col text-sm font-bold">
          <span>Url Slug</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Used in the storefront URL path (e.g., summer).
          </span>
          <input name="slug" type="text" required defaultValue={campaign?.slug} placeholder="summer" className={input} />
        </label>

        <label className="flex flex-col text-sm font-bold">
          <span>Theme Accent Color</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Hex code for the sale aesthetic (e.g., #facc15).
          </span>
          <div className="flex gap-2 items-center mt-2">
            <input name="theme_color" type="color" defaultValue={campaign?.theme_color ?? "#facc15"} className="h-11 w-12 rounded border border-white/10 bg-transparent cursor-pointer" />
            <input type="text" placeholder="#facc15" defaultValue={campaign?.theme_color ?? "#facc15"} className="h-11 flex-1 rounded-md border border-white/10 bg-black/25 px-3 text-xs outline-none focus:border-[#facc15] font-mono text-white" onChange={(e) => {
              const picker = e.target.previousSibling as HTMLInputElement;
              if (picker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                picker.value = e.target.value;
              }
            }} />
          </div>
        </label>

        <label className="flex flex-col text-sm font-bold">
          <span>Starts at</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Date and time when the sale and campaign prices begin.
          </span>
          <input name="starts_at" type="datetime-local" required defaultValue={starts} className={input} />
        </label>

        <label className="flex flex-col text-sm font-bold">
          <span>Ends at</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Date and time when the sale concludes.
          </span>
          <input name="ends_at" type="datetime-local" required defaultValue={ends} className={input} />
        </label>

        <label className="flex flex-col text-sm font-bold">
          <span>Banner Image URL (Optional)</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Image URL path for the landing header banner.
          </span>
          <input name="banner_image" type="text" defaultValue={campaign?.banner_image ?? ""} placeholder="/Assets/Promo/summer-banner.jpg" className={input} />
        </label>

        <label className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 mt-auto text-sm cursor-pointer select-none">
          <input 
            type="checkbox" 
            name="active" 
            defaultChecked={campaign ? Boolean(campaign.active) : true} 
            className="cursor-pointer"
          />
          <span>Active</span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn btn-primary">
          <CalendarRange size={17} /> {campaign ? "Save changes" : "Create Campaign"}
        </button>
        {campaign && (
          <Link href="/admin/campaigns" className="btn btn-secondary">
            Cancel edit
          </Link>
        )}
      </div>
    </form>
  );
}

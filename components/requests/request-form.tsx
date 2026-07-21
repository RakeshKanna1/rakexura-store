"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CustomSelect } from "@/components/common/custom-select";

const platformOptions = [
  { value: "Steam", label: "Steam", sublabel: "PC Steam Key / Account" },
  { value: "Epic", label: "Epic Games", sublabel: "Epic Games Store" },
  { value: "Offline", label: "Offline Mode", sublabel: "Single Player / Offline Access" },
];

export function RequestForm() {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Steam");

  const submit = async () => {
    if (name.trim().length < 2) return toast.error("Enter a game name");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Sign in to request a game");

    const { error } = await supabase.from("game_requests").insert({ user_id: user.id, game_name: name.trim(), platform });
    if (error) return toast.error(error.message);

    try {
      await fetch("/api/notifications/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameName: name.trim(),
          platform,
          customerEmail: user.email,
        }),
      });
    } catch (e) {
      console.error("Failed to notify admin of request:", e);
    }

    setName("");
    toast.success("We received your request. Thanks for requesting a game!");
  };

  return (
    <div className="glass mx-auto max-w-xl space-y-5 rounded-lg p-6">
      <div>
        <label className="block text-sm font-semibold mb-2">Game name</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Example: Resident Evil 4, Ghost of Tsushima..."
          className="h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#8b5cf6] transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Preferred platform</label>
        <CustomSelect
          options={platformOptions}
          value={platform}
          onChange={setPlatform}
          searchable={false}
        />
      </div>
      <button onClick={submit} className="h-12 w-full rounded-md bg-white text-sm font-bold text-black hover:bg-white/90 transition-all cursor-pointer">
        Submit request
      </button>
    </div>
  );
}


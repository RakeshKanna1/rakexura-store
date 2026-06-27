"use client";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

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
      <label className="block text-sm font-semibold">
        Game name
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Resident Evil 4" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none" />
      </label>
      <label className="block text-sm font-semibold">
        Preferred platform
        <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="mt-2 h-12 w-full rounded-md border border-white/10 bg-[#090c14] px-4">
          <option>Steam</option>
          <option>Epic</option>
          <option>Offline</option>
        </select>
      </label>
      <button onClick={submit} className="h-12 w-full rounded-md bg-white text-sm font-bold text-black">Submit request</button>
    </div>
  );
}


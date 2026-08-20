import { redirect } from "next/navigation";

export default async function TrackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const queryString = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (typeof val === "string") queryString.set(key, val);
  });
  const qs = queryString.toString();
  redirect(qs ? `/track-order?${qs}` : "/track-order");
}

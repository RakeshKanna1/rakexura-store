import { redirect } from "next/navigation";

export default function AdminGameRequestsPage() {
  redirect("/admin/requests?tab=games");
}

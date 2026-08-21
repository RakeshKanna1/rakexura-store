import { redirect } from "next/navigation";

export default function ResellerDashboardRedirect() {
  redirect("/dashboard#reseller");
}

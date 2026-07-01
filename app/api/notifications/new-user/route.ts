import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, notified_owner_signup")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Only notify if they haven't been notified yet and they are a customer
    if (profile.role === "customer" && !profile.notified_owner_signup) {
      const subject = `New Customer Registered: ${profile.display_name || user.email}`;
      const textContent = `
        A new customer has signed up/logged in for the first time!

        Name: ${profile.display_name || "Unknown"}
        Email: ${user.email}
        User ID: ${user.id}
      `;

      // 1. Send email to owner
      const adminEmail = process.env.OWNER_EMAIL || "12k21rakeshkannam@gmail.com";
      await sendEmail({
        to: adminEmail,
        subject,
        text: textContent,
      });

      // 2. Notify all admins in-app and via push
      try {
        const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
        if (admins && admins.length > 0) {
          const adminNotifs = admins.map((admin) => ({
            user_id: admin.id,
            title: "New User Registered",
            message: `New customer: ${profile.display_name || user.email} signed up!`,
            type: "signup",
            link: "/admin",
          }));
          await supabase.from("notifications").insert(adminNotifs);
          await Promise.all(
            adminNotifs.map((n) => sendPushNotification(n.user_id, n.title, n.message, n.link))
          );
        }
      } catch (dbError) {
        console.error("Failed to insert admin signup notification:", dbError);
      }

      // 3. Mark as notified in database
      await supabase
        .from("profiles")
        .update({ notified_owner_signup: true })
        .eq("id", user.id);
    }

    return NextResponse.json({ success: true, ok: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in new-user notification route:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function welcomeEmail(email: string, unsubscribeToken: string, siteUrl: string): { subject: string; html: string } {
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${unsubscribeToken}`;
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Talon Tech</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#1a2744;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.02em;">Talon Tech</h1>
                <p style="margin:4px 0 0;color:#c4a35a;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">You're Subscribed</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;color:#1a2744;font-size:16px;line-height:1.6;">
                <h2 style="margin:0 0 16px;color:#1a2744;font-size:22px;font-weight:800;">Welcome to the team!</h2>
                <p style="margin:0 0 16px;">Thanks for subscribing to the Talon Tech newsletter. You'll now get weekly build updates, competition recaps, and behind-the-scenes progress from our VEX V5 robotics team at Lakewood Ranch Preparatory Academy.</p>
                <p style="margin:0 0 16px;">Expect your first update soon. In the meantime, <a href="${siteUrl}" style="color:#a88c3f;text-decoration:underline;">visit our site</a> to learn more about the team.</p>
                <p style="margin:0;">— The Talon Tech Team</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px;color:#9ca3af;font-size:12px;text-align:center;line-height:1.5;">
                <p style="margin:0 0 8px;">You're receiving this because you subscribed at talontech.team.</p>
                <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a></p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;text-align:center;">&copy; ${new Date().getFullYear()} Talon Tech. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return { subject: "Welcome to Talon Tech!", html };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "A valid email is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Insert the subscriber. On conflict (already subscribed), return success without re-sending.
    const { data: inserted, error: insertErr } = await supabase
      .from("newsletter_subscribers")
      .insert({ email })
      .select("id, unsubscribe_token")
      .single<{ id: string; unsubscribe_token: string }>();

    let token: string;
    if (insertErr) {
      if (insertErr.code === "23505") {
        // Already subscribed — fetch their token for the unsubscribe link
        const { data: existing } = await supabase
          .from("newsletter_subscribers")
          .select("unsubscribe_token")
          .eq("email", email)
          .maybeSingle<{ unsubscribe_token: string }>();
        if (!existing) {
          return new Response(
            JSON.stringify({ ok: true, already: true, message: "You're already subscribed." }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({ ok: true, already: true, message: "You're already subscribed." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to subscribe. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    token = inserted.unsubscribe_token;

    // Load the Postmark token + site URL + from email and send the welcome email
    const { data: secretRows } = await supabase
      .from("app_secrets")
      .select("name, value")
      .in("name", ["postmark_server_token", "site_url", "from_email"]);
    const secrets: Record<string, string> = {};
    for (const row of secretRows ?? []) secrets[row.name] = row.value;
    const postmarkKey = secrets["postmark_server_token"] ?? null;
    const siteUrl = (secrets["site_url"] ?? "https://talontech.bolt.host").replace(/\/$/, "");
    const fromEmail = secrets["from_email"] ?? "talontech@lakewoodranchprep.org";

    if (!postmarkKey) {
      // Subscribed successfully, but can't send welcome email. Still return success.
      return new Response(
        JSON.stringify({ ok: true, email, welcome_sent: false, message: "Subscribed! (Welcome email unavailable.)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { subject, html } = welcomeEmail(email, token, siteUrl);
    let welcomeSent = false;
    let welcomeError: string | undefined;
    try {
      const res = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": postmarkKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          From: fromEmail,
          To: email,
          Subject: subject,
          HtmlBody: html,
          MessageStream: "outbound",
        }),
      });
      if (res.ok) {
        welcomeSent = true;
      } else {
        welcomeError = `Postmark ${res.status}: ${await res.text()}`;
      }
    } catch (err) {
      welcomeError = String(err);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        email,
        welcome_sent: welcomeSent,
        welcome_error: welcomeError,
        message: welcomeSent
          ? "Subscribed! Check your inbox for a welcome email."
          : "Subscribed! (Welcome email could not be sent — you'll still receive the next newsletter.)",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

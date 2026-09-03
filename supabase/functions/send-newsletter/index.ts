import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function loadSecrets(supabase: ReturnType<typeof createClient>): Promise<{
  postmarkKey: string | null;
  adminPassword: string | null;
  siteUrl: string;
  fromEmail: string;
}> {
  const { data, error } = await supabase
    .from("app_secrets")
    .select("name, value")
    .in("name", ["postmark_server_token", "admin_password", "site_url", "from_email"]);
  if (error) {
    return { postmarkKey: null, adminPassword: null, siteUrl: "", fromEmail: "" };
  }
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.name] = row.value;
  return {
    postmarkKey: map["postmark_server_token"] ?? null,
    adminPassword: map["admin_password"] ?? null,
    siteUrl: (map["site_url"] ?? "").replace(/\/$/, ""),
    fromEmail: map["from_email"] ?? "newsletter@talontech.bolt.host",
  };
}

type Issue = {
  id: string;
  subject: string;
  body_html: string;
};

type Subscriber = {
  id: string;
  email: string;
  unsubscribe_token: string;
};

function wrapEmail(subject: string, bodyHtml: string, unsubscribeUrl: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#1a2744;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.02em;">Talon Tech</h1>
                <p style="margin:4px 0 0;color:#c4a35a;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Weekly Build Update</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;color:#1a2744;font-size:16px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:12px;padding:20px;">
                  <tr>
                    <td style="color:#6b7280;font-size:13px;line-height:1.5;">
                      <p style="margin:0 0 8px;font-weight:600;color:#1a2744;">Talon Tech Robotics</p>
                      <p style="margin:0;">Lakewood Ranch Preparatory Academy &middot; VEX V5 Robotics Competition Team</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px;color:#9ca3af;font-size:12px;text-align:center;line-height:1.5;">
                <p style="margin:0 0 8px;">You're receiving this because you subscribed at talontech.team.</p>
                <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> &middot; <a href="${SITE_URL}" style="color:#9ca3af;text-decoration:underline;">Visit our site</a></p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;text-align:center;">&copy; ${new Date().getFullYear()} Talon Tech. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendOneEmail(
  apiKey: string,
  fromEmail: string,
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        From: fromEmail,
        To: to,
        Subject: subject,
        HtmlBody: html,
        MessageStream: "outbound",
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Postmark ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
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

    const { postmarkKey, adminPassword: expectedPassword, siteUrl: SITE_URL, fromEmail: FROM_EMAIL } = await loadSecrets(supabase);

    if (!postmarkKey) {
      return new Response(
        JSON.stringify({ error: "Postmark server token is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const issueId = body?.issue_id;
    const testEmail = typeof body?.test_email === "string" ? body.test_email.trim() : "";
    const adminPassword = typeof body?.admin_password === "string" ? body.admin_password : "";

    if (!expectedPassword || adminPassword !== expectedPassword) {
      return new Response(
        JSON.stringify({ error: "Unauthorized." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!issueId) {
      return new Response(
        JSON.stringify({ error: "issue_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: issue, error: issueErr } = await supabase
      .from("newsletter_issues")
      .select("id, subject, body_html, status")
      .eq("id", issueId)
      .single<Issue>();
    if (issueErr || !issue) {
      return new Response(
        JSON.stringify({ error: "Issue not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Test send: send to a single address, do not record sends or change status.
    if (testEmail) {
      const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=preview`;
      const html = wrapEmail(issue.subject, issue.body_html, unsubscribeUrl, SITE_URL);
      const result = await sendOneEmail(postmarkKey, FROM_EMAIL, testEmail, issue.subject, html);
      return new Response(
        JSON.stringify({ test: true, to: testEmail, ok: result.ok, error: result.error }),
        { status: result.ok ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (issue.status === "sent") {
      return new Response(
        JSON.stringify({ error: "This issue has already been sent." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mark as sending so a double-submit doesn't double-send.
    const { error: markErr } = await supabase
      .from("newsletter_issues")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", issueId);
    if (markErr) {
      return new Response(
        JSON.stringify({ error: "Failed to mark issue as sending." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: subscribers, error: subErr } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, unsubscribe_token")
      .is("unsubscribed_at", null)
      .returns<Subscriber[]>();

    if (subErr) {
      await supabase
        .from("newsletter_issues")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", issueId);
      return new Response(
        JSON.stringify({ error: "Failed to load subscribers." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!subscribers || subscribers.length === 0) {
      await supabase
        .from("newsletter_issues")
        .update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: 0, updated_at: new Date().toISOString() })
        .eq("id", issueId);
      return new Response(
        JSON.stringify({ sent: 0, total: 0, message: "No active subscribers." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sentCount = 0;
    let failCount = 0;
    const failedEmails: { email: string; error: string }[] = [];

    for (const sub of subscribers) {
      const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${sub.unsubscribe_token}`;
      const html = wrapEmail(issue.subject, issue.body_html, unsubscribeUrl, SITE_URL);
      const result = await sendOneEmail(postmarkKey, FROM_EMAIL, sub.email, issue.subject, html);

      const now = new Date().toISOString();
      if (result.ok) {
        sentCount++;
        await supabase.from("newsletter_sends").upsert(
          {
            issue_id: issueId,
            subscriber_id: sub.id,
            status: "sent",
            sent_at: now,
            error: null,
          },
          { onConflict: "issue_id,subscriber_id" },
        );
      } else {
        failCount++;
        failedEmails.push({ email: sub.email, error: result.error ?? "unknown" });
        await supabase.from("newsletter_sends").upsert(
          {
            issue_id: issueId,
            subscriber_id: sub.id,
            status: "failed",
            error: result.error ?? "unknown",
          },
          { onConflict: "issue_id,subscriber_id" },
        );
      }
    }

    const finalStatus = failCount === subscribers.length ? "failed" : "sent";
    await supabase
      .from("newsletter_issues")
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
        recipient_count: sentCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    return new Response(
      JSON.stringify({
        sent: sentCount,
        failed: failCount,
        total: subscribers.length,
        status: finalStatus,
        failedEmails: failedEmails.slice(0, 20),
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

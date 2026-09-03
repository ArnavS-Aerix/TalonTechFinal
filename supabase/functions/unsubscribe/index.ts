import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: subscriber, error } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, unsubscribed_at")
      .eq("unsubscribe_token", token)
      .maybeSingle<{ id: string; email: string; unsubscribed_at: string | null }>();

    if (error || !subscriber) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired unsubscribe link." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (subscriber.unsubscribed_at) {
      return new Response(
        JSON.stringify({ ok: true, already: true, email: subscriber.email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: updateErr } = await supabase
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("id", subscriber.id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: "Failed to unsubscribe. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, email: subscriber.email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

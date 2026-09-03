import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ALLOWED_SECRET_NAMES = new Set([
  "gemini_api_key",
  "postmark_server_token",
  "from_email",
  "site_url",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const adminPassword = typeof body?.admin_password === "string" ? body.admin_password : "";
    const name = typeof body?.name === "string" ? body.name : "";
    const value = typeof body?.value === "string" ? body.value : "";

    if (!name || !ALLOWED_SECRET_NAMES.has(name)) {
      return new Response(
        JSON.stringify({ error: "Unknown or disallowed secret name." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!value) {
      return new Response(
        JSON.stringify({ error: "Secret value is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: secretRow } = await supabase
      .from("app_secrets")
      .select("value")
      .eq("name", "admin_password")
      .maybeSingle<{ value: string }>();
    const expected = secretRow?.value ?? null;

    if (!expected || adminPassword !== expected) {
      return new Response(
        JSON.stringify({ error: "Unauthorized." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error } = await supabase
      .from("app_secrets")
      .upsert({ name, value, updated_at: new Date().toISOString() });

    if (error) {
      return new Response(
        JSON.stringify({ error: `Failed to save secret: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

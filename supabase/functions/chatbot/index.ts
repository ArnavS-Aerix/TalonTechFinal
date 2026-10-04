import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Secret = { name: string; value: string };
type Faq = { question: string; answer: string };
type Competition = { name: string; date: string; venue: string; city: string | null; state: string | null; status: string };
type Sponsor = { name: string; website: string | null };

async function loadSecrets(supabase: ReturnType<typeof createClient>, names: string[]): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("app_secrets").select("name, value").in("name", names);
  if (error) return {};
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as Secret[]) map[row.name] = row.value;
  return map;
}

async function loadContext(supabase: ReturnType<typeof createClient>): Promise<string> {
  const sections: string[] = [];

  const [{ data: faqs }, { data: comps }, { data: sponsors }] = await Promise.all([
    supabase.from("faqs").select("question, answer").order("sort_order", { ascending: true }).returns<Faq[]>(),
    supabase.from("competitions").select("name, date, venue, city, state, status").order("date", { ascending: true }).returns<Competition[]>(),
    supabase.from("sponsors").select("name, website").order("sort_order", { ascending: true }).returns<Sponsor[]>(),
  ]);

  sections.push(
    "You are the Talon Tech AI assistant — a helpful, friendly chatbot for the Talon Tech robotics team website. " +
    "Talon Tech is the VEX V5 robotics team at Lakewood Ranch Preparatory Academy in Bradenton, Florida. " +
    "They compete in VEX V5 Robotics competitions, building and programming robots. " +
    "Answer questions about the team, sponsorship, donations, competitions, joining the team, and robotics in general. " +
    "Keep responses concise (1-3 sentences unless the user asks for more detail). Be warm and enthusiastic. " +
    "If you don't know something specific about the team, say so and suggest using the contact form. " +
    "NEVER make up specific facts about team members, dates, or finances that aren't in the context below."
  );

  if (faqs && faqs.length > 0) {
    sections.push("=== FAQ (use these as primary knowledge) ===");
    for (const f of faqs) sections.push(`Q: ${f.question}\nA: ${f.answer}`);
  }

  if (comps && comps.length > 0) {
    sections.push("=== Competitions ===");
    for (const c of comps) {
      const loc = [c.city, c.state].filter(Boolean).join(", ");
      sections.push(`${c.name} — ${c.date} — ${c.venue}${loc ? `, ${loc}` : ""} [${c.status}]`);
    }
  }

  if (sponsors && sponsors.length > 0) {
    sections.push("=== Current Sponsors ===");
    for (const s of sponsors) sections.push(`${s.name}${s.website ? ` (${s.website})` : ""}`);
  }

  sections.push("=== Site Features ===");
  sections.push("- Sponsorship: Visit the Sponsor page for tiers (Bronze/Silver/Gold/Platinum) and to submit a sponsorship form.");
  sections.push("- Donations: Visit the Donate page to make a one-time or recurring donation.");
  sections.push("- Newsletter: Visitors can subscribe on the homepage for weekly team updates.");
  sections.push("- Contact: Visitors can use the Contact page to send a message directly to the team.");
  sections.push("- Competitions: Competition details are available on the homepage and individual competition pages.");

  return sections.join("\n\n");
}

type ChatMessage = { role: string; content: string };

async function callOpenAI(apiKey: string, systemPrompt: string, messages: ChatMessage[]): Promise<{ ok: boolean; text?: string; error?: string }> {
  try {
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `OpenAI ${res.status}: ${text}` };
    }
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!text) {
      return { ok: false, error: "Empty response from OpenAI." };
    }
    return { ok: true, text };
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

    const secrets = await loadSecrets(supabase, ["openai_api_key", "gemini_api_key"]);
    const openaiKey = secrets["openai_api_key"] ?? null;

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "AI is not configured yet. An admin needs to add an OpenAI API key in the admin settings." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const userMessage: string = typeof body?.message === "string" ? body.message : "";

    if (!userMessage.trim()) {
      return new Response(
        JSON.stringify({ error: "No message provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const context = await loadContext(supabase);

    const chatHistory: ChatMessage[] = [
      ...messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-8),
      { role: "user", content: userMessage },
    ];

    const result = await callOpenAI(openaiKey, context, chatHistory);
    if (!result.ok || !result.text) {
      return new Response(
        JSON.stringify({ error: "I couldn't generate a response right now. Please try again!" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ reply: result.text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again!" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_SITE_URL = "https://talontech.bolt.host";
const SEND_FUNCTION_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-newsletter`;

type Secret = { name: string; value: string };

type ProgressEntry = {
  id: string;
  title: string;
  body: string;
  category: string;
  week_of: string;
};

type NotebookEntry = {
  id: string;
  title: string;
  body: string;
  entry_date: string;
};

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
};

async function loadSecrets(supabase: ReturnType<typeof createClient>, names: string[]): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("app_secrets").select("name, value").in("name", names);
  if (error) return {};
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as Secret[]) map[row.name] = row.value;
  return map;
}

function photoUrl(storagePath: string): string {
  const bucket = "progress-photos";
  return `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/${bucket}/${storagePath}`;
}

function buildPrompt(
  progress: ProgressEntry[],
  notebooks: NotebookEntry[],
  photos: Photo[],
  weekLabel: string,
): string {
  const sections: string[] = [];

  sections.push(
    `You are the newsletter writer for Talon Tech, a high-school VEX V5 robotics competition team at Lakewood Ranch Preparatory Academy. Write a warm, engaging weekly update email to our subscribers (parents, sponsors, and supporters).`,
  );
  sections.push(
    `Use the raw content below to write the email. Do NOT just list the raw notes — synthesize them into a flowing, readable update with a short intro, themed sections (with <h2> headings), and a brief closing thanking supporters. Keep it concise (200-400 words). Use second person ("we") to refer to the team.`,
  );
  sections.push(
    `Output ONLY an HTML fragment (no <html>, <head>, or <body> tags — just the inner content using <h2>, <p>, <ul>, <li>, <strong>, <a> tags). Do not include a greeting like "Dear supporters" — the email template adds that. Start directly with the first section heading or a one-sentence intro.`,
  );
  sections.push(`Week: ${weekLabel}`);

  if (progress.length > 0) {
    sections.push("=== PROGRESS ENTRIES (this week's updates from the team) ===");
    for (const p of progress) {
      sections.push(`[${p.category.toUpperCase()}] ${p.title} (week of ${p.week_of})\n${p.body}`);
    }
  }

  if (notebooks.length > 0) {
    sections.push("=== ENGINEERING NOTEBOOK EXCERPTS (raw technical notes — summarize, don't copy verbatim) ===");
    for (const n of notebooks) {
      sections.push(`${n.title} (${n.entry_date})\n${n.body}`);
    }
  }

  if (photos.length > 0) {
    sections.push("=== PHOTOS (include these as <img> tags with alt text from the caption; use max-width:100%; border-radius:12px; margin:16px 0;) ===");
    for (const ph of photos) {
      const url = photoUrl(ph.storage_path);
      const alt = ph.caption ?? "Talon Tech progress photo";
      sections.push(`Photo URL: ${url} | Caption: ${alt}`);
    }
  }

  if (progress.length === 0 && notebooks.length === 0) {
    sections.push("NOTE: There is no new content this week. Write a very short email (2-3 sentences) saying it was a quieter week but the team is still pushing forward, and thanking supporters. Keep it genuine, not filler.");
  }

  sections.push("Remember: HTML fragment only, no outer document tags, no greeting line. Begin now.");
  return sections.join("\n\n");
}

async function callLLM(apiKey: string, prompt: string): Promise<{ ok: boolean; html?: string; error?: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "You are a skilled newsletter writer for a high-school robotics team. You write warm, concise, professional HTML email content." }],
          },
          contents: [
            { role: "user", parts: [{ text: prompt }] },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
          },
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Gemini ${res.status}: ${text}` };
    }
    const json = await res.json();
    const html = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).filter(Boolean).join("\n");
    if (!html) {
      const blockReason = json?.promptFeedback?.blockReason;
      return { ok: false, error: blockReason ? `Empty Gemini response (blocked: ${blockReason}).` : "Empty Gemini response." };
    }
    return { ok: true, html };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function weekLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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

    const secrets = await loadSecrets(supabase, ["admin_password", "gemini_api_key", "postmark_server_token", "site_url"]);
    const adminPassword = secrets["admin_password"] ?? null;
    const geminiKey = secrets["gemini_api_key"] ?? null;
    const postmarkKey = secrets["postmark_server_token"] ?? null;

    const body = await req.json().catch(() => ({}));
    const isCron = body?.cron === true;
    const providedPassword = typeof body?.admin_password === "string" ? body.admin_password : "";
    const autoSend = body?.auto_send === true;

    // Auth: cron calls include a shared secret in admin_password; manual calls use the real admin password.
    if (!isCron) {
      if (!adminPassword || providedPassword !== adminPassword) {
        return new Response(
          JSON.stringify({ error: "Unauthorized." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      // Cron uses the same admin_password as its shared secret.
      if (!adminPassword || providedPassword !== adminPassword) {
        return new Response(
          JSON.stringify({ error: "Unauthorized cron call." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is not configured. Add it in the admin settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Load unreported content
    const { data: progress, error: pErr } = await supabase
      .from("progress_entries")
      .select("id, title, body, category, week_of")
      .eq("reported", false)
      .order("created_at", { ascending: true })
      .returns<ProgressEntry[]>();

    const { data: notebooks, error: nErr } = await supabase
      .from("notebook_entries")
      .select("id, title, body, entry_date")
      .eq("reported", false)
      .order("entry_date", { ascending: true })
      .returns<NotebookEntry[]>();

    if (pErr || nErr) {
      return new Response(
        JSON.stringify({ error: "Failed to load content." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Load photos linked to the unreported progress entries
    const progressIds = (progress ?? []).map((p) => p.id);
    let photos: Photo[] = [];
    if (progressIds.length > 0) {
      const { data: photoData } = await supabase
        .from("progress_photos")
        .select("id, storage_path, caption")
        .in("progress_entry_id", progressIds)
        .order("created_at", { ascending: true })
        .returns<Photo[]>();
      photos = photoData ?? [];
    }

    const progressList = progress ?? [];
    const notebookList = notebooks ?? [];

    // If cron and there's no content at all, skip silently.
    if (isCron && progressList.length === 0 && notebookList.length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No new content to report." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = buildPrompt(progressList, notebookList, photos, weekLabel(new Date()));
    const llmResult = await callLLM(geminiKey, prompt);
    if (!llmResult.ok || !llmResult.html) {
      return new Response(
        JSON.stringify({ error: `AI generation failed: ${llmResult.error}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subject = `Talon Tech Weekly Update — ${weekLabel(new Date())}`;
    const source = isCron ? "auto" : "generated";

    // Save the generated issue as a draft (or 'sending' if auto-send)
    const insertStatus = autoSend ? "sending" : "draft";
    const { data: issue, error: issueErr } = await supabase
      .from("newsletter_issues")
      .insert({
        subject,
        body_html: llmResult.html,
        status: insertStatus,
        source,
      })
      .select("id, subject, body_html")
      .single<{ id: string; subject: string; body_html: string }>();

    if (issueErr || !issue) {
      return new Response(
        JSON.stringify({ error: "Failed to save generated issue." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mark content as reported so it won't be included next time
    const reportedIds = progressList.map((p) => p.id);
    const reportedNotebookIds = notebookList.map((n) => n.id);
    if (reportedIds.length > 0) {
      await supabase.from("progress_entries").update({ reported: true }).in("id", reportedIds);
    }
    if (reportedNotebookIds.length > 0) {
      await supabase.from("notebook_entries").update({ reported: true }).in("id", reportedNotebookIds);
    }

    // If auto-send, call the send-newsletter function
    if (autoSend && postmarkKey) {
      try {
        const sendRes = await fetch(SEND_FUNCTION_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issue_id: issue.id, admin_password: adminPassword }),
        });
        const sendJson = await sendRes.json().catch(() => ({}));
        if (!sendRes.ok) {
          // Mark issue as failed but still return the generated issue info
          await supabase.from("newsletter_issues").update({ status: "failed" }).eq("id", issue.id);
          return new Response(
            JSON.stringify({ generated: true, issue_id: issue.id, sent: false, error: sendJson?.error ?? "Send failed." }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({ generated: true, issue_id: issue.id, sent: true, send_result: sendJson }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (err) {
        await supabase.from("newsletter_issues").update({ status: "failed" }).eq("id", issue.id);
        return new Response(
          JSON.stringify({ generated: true, issue_id: issue.id, sent: false, error: String(err) }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({ generated: true, issue_id: issue.id, sent: false, subject: issue.subject }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

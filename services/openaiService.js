const SYSTEM_PROMPT = [
  "You are an assistant that turns messy student notes into a clear study plan.",
  "Return only valid JSON using this shape:",
  "{",
  '  "cleanNotes": ["..."],',
  '  "studyTasks": ["..."],',
  '  "studyOrder": ["..."]',
  "}",
  "Rules:",
  "- Keep writing beginner-friendly.",
  "- Detect subjects and mention them in cleanNotes when relevant.",
  "- Keep each list between 3 and 8 items.",
  "- studyOrder should be a practical sequence to follow."
].join("\n");

async function cleanStudentNotes(rawNotes, env = {}) {
  const apiKey = env.AI_STUDY_BUDDY_API_KEY;
  
  if (!apiKey) {
    throw new Error("AI_STUDY_BUDDY_API_KEY secret is not set in Cloudflare Workers. Please configure it in wrangler secrets.");
  }

  const siteUrl = env.OPENROUTER_SITE_URL || "http://localhost:3000";
  const appName = env.OPENROUTER_APP_NAME || "AI Study Planner";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": siteUrl,
      "X-Title": appName,
    },
    body: JSON.stringify({
      model: "arcee-ai/trinity-large-preview:free",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Messy notes:\n${rawNotes}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const textOutput = data.choices?.[0]?.message?.content || "";
  const parsed = parseModelJson(textOutput);

  return {
    cleanNotes: ensureStringArray(parsed.cleanNotes),
    studyTasks: ensureStringArray(parsed.studyTasks),
    studyOrder: ensureStringArray(parsed.studyOrder)
  };
}

function ensureStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function parseModelJson(text) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new Error("Model output did not contain valid JSON.");
    }

    const jsonSlice = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(jsonSlice);
  }
}

export { cleanStudentNotes };

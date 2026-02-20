const OpenAI = require("openai");

const usingOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);

const client = new OpenAI({
  apiKey: usingOpenRouter ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY,
  baseURL: usingOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
  defaultHeaders: usingOpenRouter
    ? {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "AI Study Planner"
      }
    : undefined
});

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

async function cleanStudentNotes(rawNotes) {
  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
    throw new Error("Set OPENROUTER_API_KEY (or OPENAI_API_KEY) in environment variables.");
  }

  const response = await client.responses.create({
    model: process.env.AI_MODEL || (usingOpenRouter ? "arcee-ai/trinity-large-preview:free" : "gpt-4.1-mini"),
    temperature: 0.2,
    input: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: `Messy notes:\n${rawNotes}`
      }
    ]
  });

  const textOutput = response.output_text || "";
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

module.exports = {
  cleanStudentNotes
};

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

import crypto from "node:crypto";
import { config } from "./config.js";

const signalCategories = [
  { name: "Business Signal", weight: 20 },
  { name: "AI Shift", weight: 15 },
  { name: "Internet Behavior", weight: 15 },
  { name: "Distribution", weight: 10 },
  { name: "Founder / Operator Insight", weight: 10 },
  { name: "Creator Economy", weight: 10 },
  { name: "Operational Systems", weight: 8 },
  { name: "Market Shift", weight: 5 },
  { name: "Automation", weight: 4 },
  { name: "Engagement Question", weight: 3 }
];

const builderWireSpec = [
  "You are the automated content engine for an X/Twitter account called The Builder Wire.",
  "",
  "The Builder Wire is NOT:",
  "- a motivational page",
  "- a hustle culture page",
  "- a crypto spam account",
  "- a generic AI news page",
  "- a quote repost page",
  "- a LinkedIn-style business page",
  "",
  "It is a high-signal internet business intelligence feed built for operators, founders, builders, and internet-native entrepreneurs.",
  "",
  "Brand positioning: The internet changes fast. We track the signals behind business, AI, creators, and market shifts.",
  "Tagline: BUILT FOR OPERATORS.",
  "",
  "Core mission: generate short, sharp, repostable posts about AI, business, internet shifts, creator economy, distribution, systems, founders, startups, market behavior, operational insights, leverage, scaling, media, attention, and automation.",
  "",
  "Tone: intelligent, calm, analytical, internet-native, concise, signal-heavy, future-facing, slightly cold, operator-focused.",
  "Account feel: a business signal terminal for internet builders.",
  "Posts should feel like a smart operator noticing patterns before everyone else.",
  "",
  "Writing style:",
  "- short and compressed",
  "- 1-4 lines",
  "- high signal density",
  "- easy to scan",
  "- no fluff",
  "- no overexplaining",
  "- minimal emojis",
  "- no hashtags unless manually requested",
  "- no corporate tone",
  "- no fake-deep writing",
  "- write like X, not LinkedIn",
  "- fragments are allowed",
  "- punchy endings are better than complete explanations",
  "- avoid semicolon-heavy sentences",
  "- avoid consultant language",
  "- avoid VC-demo-day language",
  "",
  "Avoid:",
  "- generic motivation",
  "- work hard / wake up early / discipline content",
  "- hustle culture",
  "- startup guru tone",
  "- productivity influencer tone",
  "- fake inspiration",
  "- overused Elon Musk quotes",
  "- crypto shilling",
  "- obvious AI wording",
  "- sounding like ChatGPT",
  "- sounding too emotional",
  "- sounding preachy",
  "- phrases like asymmetric leverage, premium asset, redefine value, operational excellence, unlock potential, manual optimizations",
  "- repeating phrases like AI lowered, The internet is changing, Creators are becoming",
  "",
  "Good examples:",
  "AI lowered execution cost.\n\nNow taste, distribution, and judgment become the leverage.",
  "The internet rewards speed.\n\nOperators win by knowing what not to react to.",
  "Creators are becoming media companies.\n\nMost brands still treat them like rented attention.",
  "Search is becoming conversational.\n\nThat changes who gets discovered.",
  "Most teams do not need more tools.\n\nThey need cleaner systems and less operational noise.",
  "Distribution is becoming more valuable than product quality.",
  "The next advantage is not information.\n\nIt is signal filtering.",
  "The best operators do not chase every signal.\n\nThey build filters.",
  "AI makes execution cheaper.\n\nIt makes bad judgment more expensive.",
  "Every platform wants native content.\nEvery business wants reusable assets.\n\nThat tension is the game.",
  "Most teams call it a growth problem.\n\nIt is usually a distribution system problem.",
  "",
  "Rotate between post structures:",
  "1. Observation -> implication",
  "2. Shift -> consequence",
  "3. Contradiction -> insight",
  "4. Trend -> warning",
  "5. Problem -> hidden truth",
  "6. Question -> tension",
  "",
  "Compression rules:",
  "- shorter is usually stronger",
  "- remove unnecessary words",
  "- prefer implication over explanation",
  "- clarity over complexity",
  "- strong endings matter",
  "- if a sentence sounds impressive but not useful, delete it",
  "- prefer 8 simple words over 4 inflated words",
  "",
  "Reject posts that sound generic, motivational, LinkedIn-like, overexplained, buzzword-heavy, startup-coach-like, emotionally manipulative, or like productivity advice.",
  "",
  "A strong Builder Wire post should feel repostable, contain a clear observation, imply a deeper shift, sound intelligent without trying hard, feel relevant to modern internet business, and make ambitious people pause briefly.",
  "",
  "High-signal words to naturally orbit around: leverage, systems, distribution, operators, builders, signals, shifts, execution, scale, infrastructure, positioning, friction, networks, discovery, velocity, media, automation, attention, workflow, intelligence.",
  "",
  "Optimize for signal density, repostability, clarity, and modern internet relevance.",
  "Do not optimize for motivation, inspiration, sounding wise, or sounding corporate."
].join("\n");

export async function generatePosts({ items, existingTexts, limit, sourceSummaryLimit }) {
  const candidates = [];

  const aiSignals = await generateBuilderWireSignals(limit);
  for (const signal of aiSignals) {
    candidates.push(makePost(signal.category || "SIGNAL", signal.text || signal, null));
  }

  for (const item of items.slice(0, sourceSummaryLimit)) {
    const generated = await summarizeItem(item);
    candidates.push(makePost("SOURCE_SUMMARY", generated, item));
  }

  const unique = candidates.filter((post) => !existingTexts.has(normalizeText(post.text)));
  return unique.slice(0, limit);
}

export function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

async function summarizeItem(item) {
  if (!config.openAiApiKey) {
    return "";
  }

  const prompt = [
    "Create one safe automated X post for The Builder Wire.",
    builderWireSpec,
    "Rules:",
    "- Return only the final post text.",
    "- Max 260 characters total.",
    "- 1-4 short lines.",
    "- No hashtags.",
    "- No emojis.",
    "- No mentions.",
    "- No links during the test phase.",
    "- No hype, no clickbait, no motivation-page language, no investment advice, no accusations.",
    "- Summarize cautiously.",
    "- If the item is controversial, legal, political, scandal-related, or market advice, output exactly: BLOCK",
    "",
    `Source: ${item.sourceName}`,
    `Title: ${item.title}`,
    `Description: ${item.description || ""}`,
    `URL: ${item.link}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.openAiApiKey}`
    },
    body: JSON.stringify({
      model: config.openAiModel,
      input: prompt
    })
  });

  if (!response.ok) {
    return "";
  }

  const data = await response.json();
  const text = extractOutputText(data).trim();
  return text === "BLOCK" ? "" : text;
}

async function generateBuilderWireSignals(count) {
  if (!config.openAiApiKey) {
    console.warn("OpenAI key not found. Skipping AI signal generation.");
    return [];
  }

  const categories = pickWeightedCategories(count);
  const prompt = [
    `Generate ${count} original X posts for The Builder Wire.`,
    builderWireSpec,
    `Use these categories in order: ${categories.join(", ")}.`,
    "Category definitions:",
    "- AI Shift: AI changing execution, work, creativity, SaaS, agencies, content, search, and operations.",
    "- Internet Behavior: how the internet, search, social platforms, media, and distribution are changing.",
    "- Business Signal: business models, market behavior, monetization, distribution, startups, and online companies.",
    "- Founder / Operator Insight: systems, execution, hiring, delegation, scaling, burnout, focus, chaos, and decision-making.",
    "- Creator Economy: creators as media companies, personal brands, audience ownership, content distribution, and monetization.",
    "- Distribution: discovery, attention, audience, channels, media, search, social, and demand capture.",
    "- Operational Systems: workflow, delegation, automation, decision loops, friction, and process design.",
    "- Market Shift: changes in how customers, platforms, or online companies behave.",
    "- Automation: AI and software removing manual work, changing margins, and compressing teams.",
    "- Engagement Question: concise questions designed to get replies from founders/builders/operators.",
    "Rules:",
    "- Return JSON only: an array of objects with text and category.",
    "- Every post must be short and clear.",
    "- Most posts should be 1-4 lines.",
    "- Each post must be under 220 characters.",
    "- Prefer 80-180 characters.",
    "- Use short sentences.",
    "- Line breaks are welcome.",
    "- No URLs.",
    "- No hashtags.",
    "- No mentions.",
    "- Avoid emojis.",
    "- No financial advice.",
    "- No claims about real people or companies.",
    "- No legal, political, scandal, fraud, or controversy topics.",
    "- Do not sound like a motivational page.",
    "- Do not post generic quotes.",
    "- Do not post work hard, wake up early, discipline is everything type content.",
    "- Do not mention crypto unless clearly business-relevant.",
    "- Do not make breaking-news claims without source data.",
    "- If no source is provided, write evergreen business/AI/internet observations.",
    "- Before returning, silently reject weak posts and replace them with stronger ones."
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.openAiApiKey}`
    },
    body: JSON.stringify({
      model: config.openAiModel,
      input: prompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`OpenAI generation failed: HTTP ${response.status} ${errorText.slice(0, 200)}`);
    return [];
  }

  const data = await response.json();
  const text = stripCodeFence(extractOutputText(data).trim());
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") return { text: item, category: "SIGNAL" };
        return {
          text: typeof item.text === "string" ? item.text : "",
          category: typeof item.category === "string" ? item.category : "SIGNAL"
        };
      })
      .filter((item) => item.text);
  } catch {
    const fallback = text
      .split(/\n+/)
      .map((line) => line.replace(/^[-*\d.\s"]+|["]+$/g, "").trim())
      .filter(Boolean);
    if (!fallback.length) console.warn("OpenAI generation returned no usable text.");
    return fallback.map((item) => ({ text: item, category: "SIGNAL" }));
  }
}

function stripCodeFence(text) {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((part) => part.content || [])
    .map((content) => content.text || "")
    .join("\n");
}

function makePost(category, text, source) {
  return {
    id: crypto.randomUUID(),
    category,
    text,
    sourceName: source?.sourceName || null,
    sourceTitle: source?.title || null,
    sourceUrl: source?.link || null,
    status: "queued",
    createdAt: new Date().toISOString(),
    scheduledFor: null
  };
}

function pickWeightedCategories(count) {
  const expanded = signalCategories.flatMap((category) => Array(Math.max(1, Math.round(category.weight / 5))).fill(category.name));
  const selected = [];

  for (let index = 0; index < count; index += 1) {
    selected.push(expanded[Math.floor(Math.random() * expanded.length)]);
  }

  return selected;
}

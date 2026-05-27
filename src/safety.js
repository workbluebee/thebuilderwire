const blockedTerms = [
  "fraud",
  "scam",
  "lawsuit",
  "sued",
  "arrested",
  "bankrupt",
  "bankruptcy",
  "insider trading",
  "stock will",
  "guaranteed return",
  "guaranteed returns",
  "buy this stock",
  "sell this stock",
  "financial advice",
  "leaked",
  "private address",
  "phone number",
  "political attack"
];

const riskyTopics = [
  "layoff",
  "layoffs",
  "fired",
  "sexual harassment",
  "accused",
  "allegation",
  "criminal",
  "war",
  "terror",
  "hate"
];

const weakBrandPhrases = [
  "asymmetric leverage",
  "premium asset",
  "redefine value",
  "manual optimizations",
  "operational excellence",
  "unlock potential",
  "paradigm",
  "game-changer",
  "thought leader",
  "10x",
  "crush it"
];

export function safetyCheck(post) {
  const text = `${post.text || ""} ${post.sourceTitle || ""}`.toLowerCase();
  const reasons = [];

  for (const term of blockedTerms) {
    if (text.includes(term)) reasons.push(`blocked term: ${term}`);
  }

  for (const term of riskyTopics) {
    if (text.includes(term)) reasons.push(`manual review topic: ${term}`);
  }

  for (const term of weakBrandPhrases) {
    if (text.includes(term)) reasons.push(`weak brand phrase: ${term}`);
  }

  if ((post.text || "").length > 275) reasons.push("too long for X post");
  if (/(^|\s)@\w+/.test(post.text || "")) reasons.push("mentions are disabled for auto-posts");
  if (/(^|\s)#\w+/.test(post.text || "")) reasons.push("hashtags are disabled for auto-posts");
  if (/[\u{1F300}-\u{1FAFF}]/u.test(post.text || "")) reasons.push("emojis are disabled for auto-posts");
  if (/(dm me|send your|phone|email address)/i.test(post.text || "")) {
    reasons.push("asks for personal/private contact");
  }

  return {
    ok: reasons.length === 0,
    reasons
  };
}

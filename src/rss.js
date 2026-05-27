export async function fetchTrustedItems(sources) {
  const enabled = sources.filter((source) => source.enabled);
  const results = [];

  for (const source of enabled) {
    try {
      const response = await fetch(source.url, {
        headers: { "user-agent": "ceobeingceo-safe-x-bot/0.1" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      for (const item of parseRss(xml).slice(0, 5)) {
        results.push({ ...item, sourceName: source.name });
      }
    } catch (error) {
      results.push({
        sourceName: source.name,
        title: `Source fetch failed: ${source.name}`,
        link: source.url,
        error: error.message
      });
    }
  }

  return results.filter((item) => !item.error);
}

function parseRss(xml) {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  return itemMatches.map((itemXml) => ({
    title: decodeXml(readTag(itemXml, "title")),
    link: decodeXml(readTag(itemXml, "link") || readAtomLink(itemXml)),
    description: stripHtml(decodeXml(readTag(itemXml, "description") || readTag(itemXml, "summary") || ""))
  })).filter((item) => item.title && item.link);
}

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
}

function readAtomLink(xml) {
  const match = xml.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return match ? match[1] : "";
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

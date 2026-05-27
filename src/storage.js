import fs from "node:fs";
import path from "node:path";
import { dataDir } from "./config.js";

export const files = {
  sources: path.join(dataDir, "sources.json"),
  quotes: path.join(dataDir, "quotes.json"),
  queue: path.join(dataDir, "queue.json"),
  postLog: path.join(dataDir, "post-log.json"),
  blocked: path.join(dataDir, "blocked.json")
};

export function ensureDataFiles() {
  fs.mkdirSync(dataDir, { recursive: true });

  writeIfMissing(files.sources, [
    {
      name: "Y Combinator",
      url: "https://www.ycombinator.com/blog/rss",
      enabled: true
    },
    {
      name: "a16z",
      url: "https://a16z.com/feed/",
      enabled: true
    },
    {
      name: "First Round Review",
      url: "https://review.firstround.com/feed.xml",
      enabled: true
    }
  ]);

  writeIfMissing(files.quotes, [
    {
      text: "The best way to predict the future is to invent it.",
      author: "Alan Kay"
    },
    {
      text: "Make something people want.",
      author: "Y Combinator"
    },
    {
      text: "If you are not embarrassed by the first version of your product, you have launched too late.",
      author: "Reid Hoffman"
    }
  ]);

  writeIfMissing(files.queue, []);
  writeIfMissing(files.postLog, []);
  writeIfMissing(files.blocked, []);
}

export function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function appendJson(file, items) {
  const current = readJson(file, []);
  writeJson(file, current.concat(items));
}

function writeIfMissing(file, value) {
  if (!fs.existsSync(file)) writeJson(file, value);
}

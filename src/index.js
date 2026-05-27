import { config } from "./config.js";
import { generatePosts, normalizeText } from "./generator.js";
import { publishPost } from "./poster.js";
import { fetchTrustedItems } from "./rss.js";
import { safetyCheck } from "./safety.js";
import { appendJson, ensureDataFiles, files, readJson, writeJson } from "./storage.js";

const command = process.argv[2] || "run";

ensureDataFiles();

if (command === "init") {
  console.log("Data files initialized.");
} else if (command === "generate") {
  await generate();
} else if (command === "post-due") {
  await postDue();
} else if (command === "safety-check") {
  safetyReport();
} else if (command === "run") {
  await generate();
  await postDue();
} else {
  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

async function generate() {
  const sources = readJson(files.sources, []);
  const quotes = readJson(files.quotes, []);
  const queue = readJson(files.queue, []);
  const log = readJson(files.postLog, []);
  const existingTexts = new Set([...queue, ...log].map((post) => normalizeText(post.text || "")));

  const items = config.sourceSummariesPerRun > 0 ? await fetchTrustedItems(sources) : [];
  const candidates = await generatePosts({
    items,
    quotes,
    existingTexts,
    limit: config.postsPerRun * 2,
    sourceSummaryLimit: config.sourceSummariesPerRun
  });

  const approved = [];
  const blocked = [];

  for (const post of candidates) {
    if (!post.text) continue;
    const result = safetyCheck(post);
    if (result.ok) {
      approved.push(schedulePost(post, queue.concat(approved)));
    } else {
      blocked.push({ ...post, status: "blocked", blockedAt: new Date().toISOString(), reasons: result.reasons });
    }
  }

  const cappedApproved = approved.slice(0, config.postsPerRun);
  writeJson(files.queue, queue.concat(cappedApproved));
  if (blocked.length) appendJson(files.blocked, blocked);

  console.log(`Generated ${cappedApproved.length} queued post(s). Blocked ${blocked.length}.`);
}

async function postDue() {
  const queue = readJson(files.queue, []);
  const now = Date.now();
  const due = queue.filter((post) => post.status === "queued" && Date.parse(post.scheduledFor || post.createdAt) <= now);
  const toPost = due.slice(0, 1);
  const dueNotPosted = due.slice(1);
  const remaining = queue.filter((post) => !due.includes(post)).concat(dueNotPosted);
  const posted = [];
  const failed = [];

  for (const post of toPost) {
    try {
      const result = await publishPost(post);
      posted.push({
        ...post,
        status: result.dryRun ? "dry-run-posted" : "posted",
        postedAt: new Date().toISOString(),
        xPostId: result.xPostId
      });
      console.log(result.dryRun ? `[DRY RUN]\n${post.text}` : `Posted ${result.xPostId}`);
    } catch (error) {
      failed.push({ ...post, status: "failed", failedAt: new Date().toISOString(), error: error.message });
      console.error(error.message);
    }
  }

  writeJson(files.queue, remaining.concat(failed));
  if (posted.length) appendJson(files.postLog, posted);
  if (failed.length) process.exitCode = 1;
}

function safetyReport() {
  const queue = readJson(files.queue, []);
  const blocked = readJson(files.blocked, []);
  const log = readJson(files.postLog, []);

  console.log(`Queued: ${queue.length}`);
  console.log(`Blocked: ${blocked.length}`);
  console.log(`Posted/dry-run: ${log.length}`);
}

function schedulePost(post, queue) {
  const intervalMs = config.minPostIntervalMinutes * 60 * 1000;
  const latestScheduled = queue
    .map((queuedPost) => Date.parse(queuedPost.scheduledFor || queuedPost.createdAt))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];

  if (!latestScheduled) {
    return {
      ...post,
      scheduledFor: new Date().toISOString()
    };
  }

  const base = Math.max(Date.now(), latestScheduled);
  return {
    ...post,
    scheduledFor: new Date(base + intervalMs).toISOString()
  };
}

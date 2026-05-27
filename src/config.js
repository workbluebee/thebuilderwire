import fs from "node:fs";
import path from "node:path";

loadDotEnv();

export const rootDir = process.cwd();
export const dataDir = path.join(rootDir, process.env.DATA_DIR || "data");

export const config = {
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  xUserAccessToken: process.env.X_USER_ACCESS_TOKEN || "",
  xRefreshToken: process.env.X_REFRESH_TOKEN || "",
  xClientId: process.env.X_CLIENT_ID || "",
  xClientSecret: process.env.X_CLIENT_SECRET || "",
  xApiKey: process.env.X_API_KEY || "",
  xApiSecret: process.env.X_API_SECRET || "",
  xAccessToken: process.env.X_ACCESS_TOKEN || "",
  xAccessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET || "",
  dryRun: (process.env.DRY_RUN || "true").toLowerCase() !== "false",
  botBrand: process.env.BOT_BRAND || "ceobeingceo",
  postsPerRun: Number.parseInt(process.env.POSTS_PER_RUN || "3", 10),
  minPostIntervalMinutes: Number.parseInt(process.env.MIN_POST_INTERVAL_MINUTES || "180", 10),
  sourceSummariesPerRun: Number.parseInt(process.env.SOURCE_SUMMARIES_PER_RUN || "1", 10)
};

function loadDotEnv() {
  const envFile = process.env.ENV_FILE || ".env";
  const envPath = path.isAbsolute(envFile) ? envFile : path.join(process.cwd(), envFile);
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

import { config } from "./config.js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export async function publishPost(post) {
  if (config.dryRun) {
    return {
      dryRun: true,
      xPostId: null,
      text: post.text
    };
  }

  if (hasOAuth1Config()) {
    const response = await createTweetOAuth1(post);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`X post failed: ${JSON.stringify(data)}`);
    }

    return {
      dryRun: false,
      xPostId: data.data?.id || null,
      text: post.text
    };
  }

  if (!config.xUserAccessToken) {
    throw new Error("X OAuth credentials are required when DRY_RUN=false");
  }

  let accessToken = config.xUserAccessToken;
  let response = await createTweet(post, accessToken);

  if (response.status === 401 && config.xRefreshToken && config.xClientId) {
    const refreshed = await refreshXToken();
    accessToken = refreshed.accessToken;
    response = await createTweet(post, accessToken);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`X post failed: ${JSON.stringify(data)}`);
  }

  return {
    dryRun: false,
    xPostId: data.data?.id || null,
    text: post.text
  };
}

function hasOAuth1Config() {
  return Boolean(config.xApiKey && config.xApiSecret && config.xAccessToken && config.xAccessTokenSecret);
}

async function createTweet(post, accessToken) {
  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ text: post.text })
  });

  return response;
}

async function createTweetOAuth1(post) {
  const url = "https://api.x.com/2/tweets";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: buildOAuth1Header("POST", url)
    },
    body: JSON.stringify({ text: post.text })
  });

  return response;
}

function buildOAuth1Header(method, url) {
  const oauthParams = {
    oauth_consumer_key: config.xApiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.xAccessToken,
    oauth_version: "1.0"
  };

  const signatureBase = [
    method.toUpperCase(),
    encodeOAuth(url),
    encodeOAuth(new URLSearchParams(sortObject(oauthParams)).toString())
  ].join("&");
  const signingKey = `${encodeOAuth(config.xApiSecret)}&${encodeOAuth(config.xAccessTokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(signatureBase).digest("base64");

  return "OAuth " + Object.entries({ ...oauthParams, oauth_signature: signature })
    .map(([key, value]) => `${encodeOAuth(key)}="${encodeOAuth(value)}"`)
    .join(", ");
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}

function encodeOAuth(value) {
  return encodeURIComponent(value)
    .replaceAll("!", "%21")
    .replaceAll("'", "%27")
    .replaceAll("(", "%28")
    .replaceAll(")", "%29")
    .replaceAll("*", "%2A");
}

async function refreshXToken() {
  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: config.xRefreshToken,
    client_id: config.xClientId
  });

  const headers = {
    "content-type": "application/x-www-form-urlencoded"
  };

  if (config.xClientSecret) {
    const basic = Buffer.from(`${config.xClientId}:${config.xClientSecret}`).toString("base64");
    headers.authorization = `Basic ${basic}`;
  }

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers,
    body: form
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`X token refresh failed: ${JSON.stringify(data)}`);
  }

  config.xUserAccessToken = data.access_token;
  if (data.refresh_token) config.xRefreshToken = data.refresh_token;
  updateLocalEnv({
    X_USER_ACCESS_TOKEN: data.access_token,
    X_REFRESH_TOKEN: data.refresh_token || config.xRefreshToken
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || config.xRefreshToken
  };
}

function updateLocalEnv(values) {
  const envFile = process.env.ENV_FILE || ".env";
  const envPath = path.isAbsolute(envFile) ? envFile : path.join(process.cwd(), envFile);
  if (!fs.existsSync(envPath)) return;

  let contents = fs.readFileSync(envPath, "utf8");
  for (const [key, value] of Object.entries(values)) {
    if (!value) continue;
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    contents = pattern.test(contents) ? contents.replace(pattern, line) : `${contents.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(envPath, contents.endsWith("\n") ? contents : `${contents}\n`);
}

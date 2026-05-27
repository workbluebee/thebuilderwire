# The Builder Wire X Bot

Automated X publishing bot for The Builder Wire.

The Builder Wire is a business/intelligence feed built for operators, founders, builders, and internet-native entrepreneurs.

Tagline:

```text
BUILT FOR OPERATORS
```

Bio:

```text
The internet changes fast.
We track the signals behind business, AI, creators, and market shifts.
```

It only auto-posts low-risk content:

- internet shifts
- business signals
- founder/operator insights
- creator economy signals
- AI signals
- occasional engagement questions

It does not automate replies, DMs, likes, follow/unfollow, or risky breaking-news claims.

## Setup

```bash
cp .env.example .env
cp .env.example .env.builderwire
npm run bot:init
npm run bot:generate
npm run bot:post-due
```

Keep `DRY_RUN=true` until the generated queue looks good.

## AI Model

The MVP uses OpenAI because this bot mostly creates short, plain-text signal posts, where lower-cost OpenAI models are enough.

Default:

```bash
OPENAI_MODEL=gpt-4.1-mini
```

Cheaper plain-text option:

```bash
OPENAI_MODEL=gpt-4.1-nano
```

Start with `gpt-4.1-mini`. Switch to `gpt-4.1-nano` only after the style is dialed in.

## X Setup

Create an X developer app, connect the bot account, and use OAuth 2.0 tokens with `tweet.write`.

Local `.env` fields:

```bash
X_USER_ACCESS_TOKEN=...
X_REFRESH_TOKEN=...
X_CLIENT_ID=...
X_CLIENT_SECRET=
```

`X_CLIENT_SECRET` is optional for public OAuth apps. The bot can refresh expired access tokens when `X_REFRESH_TOKEN` and `X_CLIENT_ID` are present.

Use separate env files for separate posting accounts:

```bash
.env                # main/current posting account
.env.builderwire    # @thebuilderwire bot account
data/               # main/current account queue and logs
data-builderwire/   # @thebuilderwire queue and logs
```

Run The Builder Wire with:

```bash
npm run builderwire:generate
npm run builderwire:post-due
npm run builderwire:run
```

The X account should use the official automated label:

```text
Automated by @ceobeingceo
```

The current public profile:

```text
The Builder Wire
@thebuilderwire

The internet changes fast.
We track the signals behind business, AI, creators, and market shifts.
```

## Commands

```bash
npm run bot:init          # create data files
npm run bot:generate      # fetch sources and queue safe posts
npm run bot:post-due      # post due queued posts, dry-run by default
npm run bot:run           # generate then post due
npm run bot:safety-check  # print blocked/queued counts
```

## Data Files

- `data/sources.json`: trusted RSS sources
- `data/quotes.json`: attributed founder/business quotes
- `data/queue.json`: generated post queue
- `data/post-log.json`: posted/dry-run records
- `data/blocked.json`: rejected content with reasons

## Plain-Text Mode

The default setup is plain text. Keep this in `.env`:

```bash
SOURCE_SUMMARIES_PER_RUN=1
```

Set it to `0` during the test phase to avoid links and sourced summaries:

```bash
SOURCE_SUMMARIES_PER_RUN=0
```

## Scheduling

Run only The Builder Wire on GitHub Actions. The workflow lives at:

```text
.github/workflows/builderwire.yml
```

Add these GitHub repository secrets:

```text
BUILDERWIRE_OPENAI_API_KEY
BUILDERWIRE_X_API_KEY
BUILDERWIRE_X_API_SECRET
BUILDERWIRE_X_ACCESS_TOKEN
BUILDERWIRE_X_ACCESS_TOKEN_SECRET
```

Use the OAuth 1.0a **Access Token and Secret** fields from X for GitHub Actions. This avoids the 2-hour OAuth 2.0 access-token expiry.

OAuth 2.0 is still supported locally as a fallback:

```text
BUILDERWIRE_X_USER_ACCESS_TOKEN
BUILDERWIRE_X_REFRESH_TOKEN
BUILDERWIRE_X_CLIENT_ID
BUILDERWIRE_X_CLIENT_SECRET
```

`BUILDERWIRE_X_CLIENT_SECRET` can be left unset if the X app does not use one.

Optional GitHub repository variables:

```text
BUILDERWIRE_OPENAI_MODEL=gpt-4.1-mini
BUILDERWIRE_DRY_RUN=false
```

The workflow runs hourly during US Eastern daytime/evening hours and can also be triggered manually from GitHub Actions.

Local Builder Wire commands:

```bash
npm run builderwire:generate
npm run builderwire:post-due
npm run builderwire:run
```

The current GitHub schedule targets 16 posts/day:

```text
8 AM-11 PM US Eastern during daylight saving time
```

GitHub cron runs in UTC, so the schedule uses:

```text
17 12-23 * * *
17 0-3 * * *
```

Revisit this when daylight saving time changes.

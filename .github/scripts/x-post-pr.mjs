// Posts a merged PR to X (Twitter) as a build-in-public update, in Book A Sloth's
// brand voice ("calm way to sell your time"). Run by .github/workflows/x-autopost-pr.yml
// on PR merge. Nothing posts unless all four X tokens are present.
//
// Flow: read the merged PR from the GitHub event → rewrite the dev-jargon title into
// a human update (Haiku, if ANTHROPIC_API_KEY is set; else a plain template) → post.
//
// Env:
//   X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET  (required, write scope)
//   ANTHROPIC_API_KEY   (optional — without it, falls back to a template, no AI rewrite)
//   GITHUB_EVENT_PATH   (set by Actions; the pull_request event payload)
//
// Self-check:  node x-post-pr.mjs --selftest   (asserts the formatter; posts nothing)

import { readFileSync } from "node:fs";

const MAX = 280;
const SITE = "https://bookasloth.com";

// Turn a rewritten body + PR into a <=280 char tweet. Link is optional (some PRs
// aren't worth linking). Truncates the text, never the link, so the tweet stays valid.
export function buildTweet(text, url) {
  const tail = url ? `\n\n${url}` : "";
  const room = MAX - tail.length;
  let body = text.trim();
  if (body.length > room) body = body.slice(0, room - 1).trimEnd() + "…"; // ellipsis
  return body + tail;
}

// Template fallback when there's no AI key. Strips the conventional-commit prefix
// (feat:/fix:/chore:) and the trailing "(#123)" so followers see a plain sentence.
export function templateUpdate(title) {
  const clean = title
    .replace(/^\s*\w+(\([^)]*\))?!?:\s*/, "") // drop "feat(scope): "
    .replace(/\s*\(#\d+\)\s*$/, "")           // drop trailing "(#1234)"
    .trim();
  return `🦥 Shipped: ${clean}`;
}

async function aiRewrite(title, body) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const prompt = `You write build-in-public updates for Book A Sloth, a platform whose brand voice is "the calm way to sell your time" — warm, plain, founder-to-follower, no hype, no emoji spam, no hashtags. Turn this merged pull request into ONE short tweet (max 240 chars) announcing the change to our audience of creators/coaches. Say what got better for them, not the code. No "PR", no jargon. At most one emoji.

Title: ${title}
Body: ${(body || "").slice(0, 1500)}`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error(`Anthropic ${res.status}: ${await res.text()}`);
      return null;
    }
    const json = await res.json();
    const text = json?.content?.[0]?.text?.trim();
    return text || null;
  } catch (e) {
    console.error("AI rewrite failed, using template:", e.message);
    return null;
  }
}

async function main() {
  const evPath = process.env.GITHUB_EVENT_PATH;
  if (!evPath) throw new Error("GITHUB_EVENT_PATH not set — run inside GitHub Actions.");
  const ev = JSON.parse(readFileSync(evPath, "utf8"));
  const pr = ev.pull_request;
  if (!pr) throw new Error("No pull_request in event payload.");

  const title = pr.title || "";
  const body = pr.body || "";
  const url = pr.html_url || SITE;

  const rewritten = (await aiRewrite(title, body)) || templateUpdate(title);
  const tweet = buildTweet(rewritten, url);

  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    console.log("X tokens missing — dry run. Would post:\n" + tweet);
    return;
  }

  const { TwitterApi } = await import("twitter-api-v2");
  const client = new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_SECRET,
  });
  const { data } = await client.v2.tweet(tweet);
  console.log(`Posted https://x.com/i/status/${data.id}\n${tweet}`);
}

if (process.argv.includes("--selftest")) {
  const assert = (c, m) => { if (!c) throw new Error("FAIL: " + m); };
  assert(templateUpdate("feat(x): add booking widget (#12)") === "🦥 Shipped: add booking widget", "prefix+PRnum strip");
  assert(templateUpdate("fix: OTP bug") === "🦥 Shipped: OTP bug", "plain fix strip");
  const long = "x".repeat(400);
  const t = buildTweet(long, "https://a.co");
  assert(t.length <= MAX, "tweet within 280");
  assert(t.endsWith("https://a.co"), "link never truncated");
  assert(buildTweet("hi", "").length === 2, "no link, no tail");
  console.log("selftest ok");
} else {
  main().catch((e) => { console.error(e); process.exit(1); });
}

# Cloudflare Edge Setup — Runbook

**Purpose:** put Cloudflare in front of Book A Sloth so volumetric/DDoS/bot traffic
is blocked at the edge, *before* it reaches Render. This is the strongest layer of
the IP-blocking system; the in-app blocklist (admin → Security → Blocked IPs) is the
second layer for app-specific abuse.

**Status:** not yet executed — gated on the `bookasloth.com` DNS move. Run this when
you move DNS to Cloudflare. No application code changes; this is all dashboard/ops,
plus **one env var** at the end (`CLIENT_IP_HEADER`).

**Topology today:** apex `bookasloth.com` → Vercel (React client); the client calls
same-origin `/api/*` which Vercel rewrites to the Render API
(`book-a-sloth.onrender.com`). Cloudflare will sit in front of the public domain.

---

## Prerequisites
- A Cloudflare account (free plan is enough to start).
- Access to the domain registrar / current DNS host (Hostinger) to change
  nameservers.
- The current DNS records (export them first — see step 1).

---

## Step 1 — Record current DNS, then add the site to Cloudflare
1. In your current DNS host (Hostinger), **screenshot / export every existing
   record** (A, AAAA, CNAME, MX, TXT — especially MX and SPF/DKIM/DMARC for email,
   and any Vercel/Render verification records). You must recreate these in
   Cloudflare or email + verification will break.
2. In Cloudflare: **Add a site** → enter `bookasloth.com` → choose the **Free** plan.
3. Cloudflare auto-imports detected records. **Compare against your export** and add
   anything missing. Do NOT proxy mail records (MX/TXT stay "DNS only" / grey cloud).

## Step 2 — Proxy the web records
- For the records that serve the website (apex `@` and `www` pointing to Vercel),
  set them to **Proxied** (orange cloud). That routes web traffic through Cloudflare.
- Leave MX, SPF/DKIM/DMARC, and any verification TXT records **DNS only** (grey).

## Step 3 — Switch nameservers
1. Cloudflare shows two assigned nameservers (e.g. `xxx.ns.cloudflare.com`).
2. In Hostinger, set the domain's nameservers to those two. Save.
3. Propagation takes minutes to a few hours. Cloudflare emails you when the site is
   **Active**. The site stays up throughout (records were copied first).

## Step 4 — SSL/TLS
- SSL/TLS → Overview → set encryption mode to **Full (strict)** (Vercel/Render both
  present valid certs). Avoid "Flexible" (causes redirect loops + insecure backhaul).
- Enable **Always Use HTTPS** (SSL/TLS → Edge Certificates).

## Step 5 — WAF managed rules
- Security → WAF → **Managed rules**: enable the **Cloudflare Managed Ruleset**
  (and OWASP Core Ruleset if available on your plan). Start in *Log* for a day if you
  want to watch for false positives, then switch to *Block*.

## Step 6 — Rate-limiting rules (edge)
These complement the app's per-route limiters by stopping floods at the edge.
- Security → WAF → **Rate limiting rules** → create rules such as:
  - **Auth/OTP:** path `contains /api/auth` OR `/api/admin-auth` → e.g. 20 requests
    / 1 min per IP → **Block** for 10 min.
  - **General API:** path `starts with /api` → e.g. 300 requests / 1 min per IP →
    **Managed Challenge**.
  Tune the numbers to your real traffic; keep them well above normal usage.

## Step 7 — IP / ASN / country block rules
- Security → WAF → **Custom rules**: add block rules as needed, e.g.
  - Block specific IPs / CIDR ranges (`ip.src in {…}`).
  - Block or challenge by country (`ip.geoip.country in {…}`) or hosting ASN if you
    see datacenter abuse.
- Note: in-app country blocking is intentionally **not** built — do it here.

## Step 8 — Bot mitigation + "Under Attack" mode
- Security → Bots → enable **Bot Fight Mode** (free).
- Know where the **"I'm Under Attack"** mode toggle is (Security → Settings →
  Security Level → *Under Attack*). Flip it on only during an active attack — it
  shows an interstitial challenge to every visitor.

---

## Step 9 — CRITICAL: set the real client-IP header

Once traffic flows through Cloudflare → (Vercel rewrite) → Render, the address
Express sees in `req.ip` is **no longer the real visitor**. The real client IP is
forwarded in a header. If you skip this, the app-layer blocklist will treat *all*
traffic as coming from one upstream IP — and a single auto-ban would lock out
**everyone**.

1. **Find which header actually carries the client IP at Render.** Temporarily log
   it: hit the site through the new Cloudflare path and check, in Render logs, the
   values of `cf-connecting-ip`, `x-forwarded-for`, and `x-real-ip` for an inbound
   request. (Cloudflare sets `CF-Connecting-IP` to the true client; whether it
   survives the Vercel rewrite to Render must be verified — that's the point of this
   step.)
2. **Set the env var on Render** to that header name, e.g.:
   ```
   CLIENT_IP_HEADER=cf-connecting-ip
   ```
   Redeploy/restart. `lib/clientIp.js` then keys every ban on the real client IP.
3. **Re-check `trust proxy`.** `server.js` currently sets `app.set('trust proxy', 1)`
   (one proxy hop). With Cloudflare + Vercel in front there may be more hops; if
   `req.ip` is still used anywhere as a fallback and looks wrong, increase the hop
   count. With `CLIENT_IP_HEADER` set, the blocklist no longer depends on `req.ip`,
   but the rate limiters in `middleware/security.js` still key on `req.ip` — so
   verify they bucket per real client, not per edge IP.
4. **Optional hardening:** once on Cloudflare, restrict Render/Vercel to only accept
   traffic with valid Cloudflare headers (e.g. Cloudflare Authenticated Origin Pulls
   or an allowlist of Cloudflare IP ranges) so attackers can't bypass the edge by
   hitting the origin directly.

---

## Verification checklist
- [ ] Site loads over HTTPS through Cloudflare (Cloudflare cookie / `cf-ray` response
      header present).
- [ ] Email still works (sent + received) — confirms MX/SPF/DKIM survived.
- [ ] Razorpay webhook still delivers (it's exempt from the in-app IP guard, but
      confirm Cloudflare WAF isn't blocking it; allowlist the webhook path if needed).
- [ ] `CLIENT_IP_HEADER` set on Render and the admin → Security → Blocked IPs page
      shows real client IPs (ban a test IP from a known address and confirm the row
      shows that address, not a Cloudflare/Vercel IP).
- [ ] Add the founder/office IP + UptimeRobot to the **Allowlist** before relying on
      auto-ban.

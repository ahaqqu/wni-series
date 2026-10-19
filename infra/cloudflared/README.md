# Cloudflare Tunnel setup

**Goal:** expose `wniseries.ahaqqu.com` to the netcup VPS without opening inbound ports.

## 1. Prerequisites

- `ahaqqu.com` zone active in Cloudflare.
- Access to the Cloudflare dashboard (Zero Trust → Tunnels).
- VPS running Docker + Compose, with outbound HTTPS allowed.

## 2. Create the tunnel

1. Cloudflare dashboard → **Zero Trust → Networks → Tunnels → Create a tunnel**.
2. Choose **Cloudflared**, name it `wni-prod`.
3. Copy the tunnel token. Store it in `/srv/wni/.env` as `CLOUDFLARE_TUNNEL_TOKEN` (mode 600). Never commit it.
4. Add a public hostname:
   - Subdomain: `wniseries`
   - Domain: `ahaqqu.com`
   - Service: `http://caddy:8080`
5. Save. The DNS record is created automatically.

## 3. Start

```bash
cd /srv/wni
docker compose --env-file .env -f compose.yaml up -d cloudflared caddy
curl -fsS https://wniseries.ahaqqu.com/api/readyz
```

## 4. Protect admin

- Cloudflare Access → Applications → Add self-hosted app:
  - `wniseries.ahaqqu.com/admin*`
  - Policy: allow your Google account (or a dedicated admin group), 2FA required.
- The API still enforces the `admin` role; Access is defense-in-depth, not the only check.

## 5. WAF / rate limits

Recommended rules (tune after launch):

- Block known bad bots on `/api/*` (do not block Google OAuth callbacks).
- Rate limit `/api/auth/*` and `/api/v1/checkout` per IP.
- Challenge `/api/v1/support` if spam.
- Cache rules: bypass `/api/*`; cache `/assets/*` immutable; HTML short TTL + purge on deploy.
- Enable HSTS after all subdomains are HTTPS.

## 6. Mayar webhooks

- Webhook URL: `https://wniseries.ahaqqu.com/api/v1/webhooks/mayar/<path-secret>`.
- Mayar public docs do not document a signature; the app treats the payload as untrusted and re-fetches transaction/member state from Mayar’s API.
- Do not add a Cloudflare challenge to the webhook path; rate-limit only.
- Keep the webhook route reachable when checkout is enabled; rotate the path secret if exposed.

## 7. Alternative: proxied origin

If Tunnel is not used:

- Expose 443 with a Cloudflare Origin Certificate.
- Restrict UFW to Cloudflare IP ranges.
- Set `trust proxy` correctly in Fastify so `request.ip`/`CF-Connecting-IP` is trustworthy.
- Keep the same Mayar API re-fetch verification; an IP allowlist is defense-in-depth only.

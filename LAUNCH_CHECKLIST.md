# PARA Launch Day Checklist
## CTO Runbook — Día 6→7

---

## 🟢 GO / NO-GO Criteria

**Launch is GO when ALL of these are true:**

- [x] `yarn test` passes (523 tests) — PARA
- [x] `pnpm build` passes — WhatZatppa
- [x] `npx tsc --noEmit` clean — PARA (pre-existing errors in bskylink/ and __tests__/ are out of scope)
- [ ] Docker images build and push successfully
- [ ] Production `.env` is populated (no `<blank>` values)
- [ ] PostgreSQL + Redis are reachable from backend containers
- [ ] PDS healthcheck returns 200 on `/_health`
- [ ] AppView healthcheck returns 200 on `/_health`
- [ ] At least one admin can log in via mobile app to production PDS
- [ ] A test post creates successfully end-to-end

---

## 📋 Pre-Launch (Now — T-24h)

### Code
- [x] TypeScript compiles clean (0 errors)
- [x] All tests pass (523/523)
- [x] Voting buttons scoped to Policy posts only
- [x] Composer render-stable (`t` in scope, no duplicate props)
- [x] PARA native feed injection gated to dev mode
- [x] Debug constants (`JOINED_THIS_WEEK`, `DISCOVER_DEBUG_DIDS`) behind `__DEV__`
- [x] `IS_DEV` logic bug fixed (`||` → `&&`)
- [x] Rate limiting ON by default in production
- [x] Redis resilience (retries, timeouts)
- [x] Readiness probe (`/_ready`) active

### Secrets & Config
- [x] Secret generator script exists (`scripts/generate-secrets.sh`)
- [ ] `PDS_REPO_SIGNING_KEY_K256_PRIVATE_KEY_HEX` generated
- [ ] `PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX` generated
- [ ] `PDS_DPOP_SECRET` generated
- [ ] `PDS_JWT_SECRET` generated
- [ ] `PDS_ADMIN_PASSWORD` set (strong, unique)
- [ ] `POSTGRES_PASSWORD` generated
- [ ] `GOOGLE_MAPS_IOS_API_KEY` provisioned
- [ ] `GOOGLE_MAPS_ANDROID_API_KEY` provisioned
- [ ] `SENTRY_AUTH_TOKEN` provisioned
- [ ] `.env` copied from `.env.example` and ALL blanks filled

### Infrastructure
- [x] `docker-compose.prod.yaml` exists (`WhatZatppa/docker-compose.prod.yaml`)
- [x] Deploy script exists (`scripts/deploy-production.sh`)
- [ ] Production server provisioned (VPS / ECS / K8s)
- [ ] DNS A-records point to server IP:
  - `pds.para.social`
  - `appview.para.social`
  - `ozone.para.social` (optional)
- [ ] SSL certificates active (Let's Encrypt / Cloudflare)
- [ ] Firewall rules: 443 (public), 2583-2586 (internal)
- [ ] Docker + Docker Compose installed on server
- [ ] `.env` and `docker-compose.prod.yaml` copied to server

---

## 🚀 Launch Sequence (T-0)

### Step 1: Deploy Backend (5 min)
```bash
ssh para-prod
mkdir -p /opt/para && cd /opt/para
# copy docker-compose.prod.yaml and .env here
docker compose -f docker-compose.prod.yaml up -d
```

### Step 2: Verify Health (2 min)
```bash
curl -f https://pds.para.social/xrpc/_health
curl -f https://appview.para.social/xrpc/_health
curl -f https://pds.para.social/xrpc/_ready
curl -f https://appview.para.social/xrpc/_ready
```

### Step 3: Seed First Accounts (3 min)
```bash
cd PARA
yarn seed:civic:apply --pds-url https://pds.para.social --admin-pass <password>
```

### Step 4: Build Mobile App (15 min)
```bash
cd PARA
EXPO_PUBLIC_ENV=production eas build --platform ios --profile production
EXPO_PUBLIC_ENV=production eas build --platform android --profile production
```

### Step 5: Smoke Test (10 min)
- [ ] Install TestFlight / APK on device
- [ ] Create account on `pds.para.social`
- [ ] Post with Policy flair
- [ ] Post with Matter flair
- [ ] Verify voting arrows appear ONLY on Policy post
- [ ] Verify PartyShield renders for `[MC]`, `[Morena]`, etc.
- [ ] Verify community join/leave works
- [ ] Verify feed loads (Following tab)

---

## 🔥 Rollback Plan

**If anything fails during launch:**

1. **Backend issues**: `docker compose -f docker-compose.prod.yaml down`
2. **App issues**: Do NOT submit to App Store. Use TestFlight / internal testing first.
3. **DNS issues**: Flip DNS back to maintenance page.
4. **Database corruption**: Restore from `postgres_data` volume snapshot.

**Emergency contacts**: [FILL IN]

---

## 📊 Post-Launch (T+1h → T+24h)

- [ ] Monitor Sentry for crash reports
- [ ] Monitor PDS logs: `docker logs -f para-pds`
- [ ] Monitor AppView logs: `docker logs -f para-bsky`
- [ ] Check Redis memory usage
- [ ] Check PostgreSQL disk usage
- [ ] First user sign-up within 1 hour?
- [ ] First post within 1 hour?
- [ ] No 5xx errors in logs?

---

## 🚧 Known Post-Launch Work

| Item | Priority | ETA |
|------|----------|-----|
| Feed generator service | P1 | Day 8-10 |
| OTA Update server (self-hosted) | P1 | Day 8-10 |
| Self-hosted PLC directory | P2 | Week 2 |
| Prometheus + Grafana observability | P2 | Week 2 |
| Feed generator (firehose + filtered) | P2 | Week 2 |
| Backup automation | P2 | Week 2 |
| CDN for blob storage | P3 | Week 3 |

---

## 🎯 Success Metrics (Week 1)

- **Uptime**: > 99.5%
- **Crash-free sessions**: > 99%
- **Sign-ups**: > 100
- **Posts**: > 500
- **Communities created**: > 10

---

*Last updated: Day 6 by CTO candidate*

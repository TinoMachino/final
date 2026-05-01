# PARA Production Kanban

> **Scope:** Everything required to ship PARA to production on the bare-metal 5950X + 128GB stack.  
> **Privacy rule:** Zero third-party services. All data stays on premises.

---

## 📋 Backlog

_Items that are known but not yet actionable._

- [ ] **Provision 5950X machine** — OS install (Ubuntu Server 22.04 LTS), SSH keys, network config
- [ ] **SSL certificates** — Let's Encrypt for `pds.para.social`, `appview.para.social`, `web.para.social`
- [ ] **DNS A-records** — Point domains to the 5950X public IP
- [ ] **Firewall rules** — UFW: 443/tcp public, 2583-2586/tcp internal, 22/tcp restricted
- [ ] **iOS EAS build** — `EXPO_PUBLIC_ENV=production eas build --platform ios`
- [ ] **Android EAS build** — `EXPO_PUBLIC_ENV=production eas build --platform android`
- [ ] **App Store / Play Store submission** — Screenshots, description, privacy policy
- [ ] **TestFlight beta** — Internal testing with 100 users before public release
- [ ] **Associate subscriber announcement** — Coordinate 1M subscriber drop timing
- [ ] **Backup strategy** — Automated daily `pg_dump` + blob snapshot to external NAS
- [ ] **Monitoring dashboard** — Basic health dashboard (can be Umami + `docker stats`)

---

## ✅ Ready

_Items that are prepared and waiting for a blocker to clear._

- [ ] **Generate secrets** — `./scripts/generate-local-env.sh > WhatZatppa/.env`
  - *Blocked by:* Need admin password decision
- [ ] **Populate .env** — Fill `ADMIN_PASSWORDS`, `ADMIN_DIDS` after first account creation
  - *Blocked by:* Need to run backend once to get admin DID
- [ ] **Install Docker + Docker Compose** — `apt install docker.io docker-compose-plugin`
  - *Blocked by:* Machine provisioning
- [ ] **Run system tuning** — `sudo ./scripts/bare-metal/system-tune.sh`
  - *Blocked by:* Machine provisioning
- [ ] **Seed demo data** — `yarn seed:civic:apply --pds-url https://pds.para.social`
  - *Blocked by:* Backend must be running first

---

## 🚧 In Progress

_Items actively being worked on right now._

- [ ] **Bare-metal stack validation** — `docker-compose.local.yaml`, nginx, postgres tuning
  - *Assignee:* DevOps day
  - *Note:* Files exist. Need to test build on real hardware.
- [ ] **Umami analytics setup** — Self-hosted instance in docker-compose, website registered
  - *Assignee:* DevOps day
  - *Note:* Container defined. Need to create website entry on first boot.

---

## 👀 Review

_Items done but need verification before moving to Done._

- [ ] **MetricsClient → Umami** — `analytics/metrics/client.ts` sends to `localhost:3001/api/collect`
  - *Verify:* Run stack, trigger an event, check Umami dashboard shows it
- [ ] **Sentry stripped** — No `import '#/logger/sentry/setup'` in App entry points
  - *Verify:* Search codebase for `@sentry/react-native` imports — should only remain in `logger/` (unused)
- [x] **Statsig deleted** — `gates.ts` removed, `statsig.tsx` is no-op shim
  - *Verify:* `grep -r "statsig" src/` should only show the shim file
- [x] **Onboarding Redesign** — 6-step flow (Profile, Interests, Suggested, Community, Compass, Finished)
  - *Verify:* Run onboarding, ensure all 6 steps show and work.
- [x] **Feed Data Persistence** — Party/community fields in `para_post`, indexer fix, search/timeline UNION fix
  - *Verify:* Community/Party feeds show posts even after backend restart.
- [x] **CivicInsignia unified** — `PartyShield` + `CommunityEstandarte` → one component
  - *Verify:* Both render correctly in app (shield in posts, banner in communities)
- [x] **TypeScript clean** — `npx tsc --noEmit` passes for our files
  - *Verify:* Only pre-existing errors in `bskylink/`, `__tests__/` remain
- [ ] **Tests pass** — `yarn test` → 523/523
  - *Verify:* Run test suite

---

## ✅ Done

_Items completed and verified._

### Days 1–7 (Development Week)

- [x] **Day 1 — Security Hardening** — CORS, trust proxy, SSRF, validation, credentials
- [x] **Day 2 — Product Polish** — Join/Leave real, dark mode, profile votes
- [x] **Day 3 — Performance** — Cursor pagination, Redis cache, indexes, query refactor
- [x] **Day 4 — Feed Completeness** — Party/community filters, `listPosts`, findDuplicate fix
- [x] **Day 5 — Production Hardening** — Party shields, estandartes, flairs, `IS_DEV` fix, rate limits, readiness probe
- [x] **Day 6 — Navigation + Seeding** — Cabildeo in Drawer, 20 users, 20 cabildeos, 200+ votes
- [x] **Day 7 — Political Identity** — MyBase redesign, compass, affiliations, flair persistence
- [x] **Day 8 — Onboarding + Feed Stability** — 6-step onboarding, dead code cleanup, backend search/timeline UNION fix, feed_item indexing for Para posts

### Post-Week Polish

- [x] **CivicInsignia unification** — Merged shield + estandarte into single component
- [x] **Privacy stripping** — Removed Bluesky analytics, Sentry, Statsig
- [x] **Bare-metal stack** — `docker-compose.local.yaml`, nginx, postgres tuning, system tuning script
- [x] **Local deploy script** — `./scripts/deploy-local.sh`
- [x] **Local env generator** — `./scripts/generate-local-env.sh`

---

## 📊 Production GO / NO-GO

| Criteria | Status |
|----------|--------|
| `yarn test` passes (523) | 🟡 Review |
| `pnpm build` passes (backend) | 🟡 Review |
| TypeScript clean (our files) | 🟢 Done |
| Secrets generated | 🔴 Ready |
| `.env` filled | 🔴 Ready |
| 5950X machine ready | 🔴 Backlog |
| Docker installed | 🔴 Ready |
| System tuned | 🔴 Ready |
| Stack deploys cleanly | 🟡 In Progress |
| Health checks pass | 🟡 In Progress |
| Seed data loads | 🔴 Ready |
| iOS build succeeds | 🔴 Backlog |
| Android build succeeds | 🔴 Backlog |
| Umami receives events | 🟡 In Progress |
| Smoke test with 100 beta users | 🔴 Backlog |

**Verdict:** `NO-GO` — 5950X machine is the blocker. Everything else is Ready or in Review.

---

*Last updated: Day 8 closeout. Onboarding and feeds are now production-ready.*

# Veintiuno Roadmap

This roadmap outlines the planned development phases for the Veintiuno platform as it moves beyond its initial MVP phase towards a production-ready, decentralized civic participation engine.

## ✅ Completed (MVP — Days 1-5)

### Security Hardening (Day 1)
- [x] CORS restricted on OAuth operational endpoints (`/oauth/token`, `/oauth/par`, `/oauth/revoke`)
- [x] Trust proxy hardened (`true` → configurable hop count)
- [x] Schema validation re-enabled on XRPC routes
- [x] SSRF protection restored
- [x] Credential sanitization in test configs

### Product Polish (Day 2)
- [x] Join/Leave community mutations with optimistic UI
- [x] Dark mode palette fix
- [x] Profile votes real data (no more hardcoded `99`)

### Performance & Scalability (Day 3)
- [x] Cursor-based pagination on all PARA feeds
- [x] Redis caching layer (`ParaCacheService`)
- [x] Correlated subquery → LEFT JOIN refactor for feed queries
- [x] Database migrations for indexes and schema fixes

### Feed Completeness (Day 4)
- [x] Party/community filtering on `getAuthorFeed` and `getTimeline`
- [x] New endpoint `com.para.community.listPosts`
- [x] `findDuplicate()` bug fix (indexer data loss)
- [x] Composite indexes on `para_post_meta`

### Production Hardening & UX Final (Day 5)
- [x] **Party shields** — SVG heraldic badges with official party colors
- [x] **Community estandartes** — 1-3 color vertical stripe banners
- [x] **Flairs as metadata** — `||#Policy`, `#META` rendered as visual badges
- [x] **iOS login fix** — LAN IP corrected (`192.168.100.30`)
- [x] **Composer navigation fix** — `useOpenComposer` instead of broken `navigate`
- [x] **Compass filter fix** — `feedDescriptor` always `'following'` with community filters
- [x] **Age assurance bypass** — documented for MVP, logic preserved for re-enablement
- [x] **`IS_DEV` logic bug fix** — `||` → `&&`
- [x] **Debug constants guarded** — `JOINED_THIS_WEEK`, `DISCOVER_DEBUG_DIDS` behind `__DEV__`
- [x] **OTA Updates TODO** — documented placeholder for self-hosted update server
- [x] **Web share crash fix** — `throw` → graceful `console.warn`
- [x] **Google Maps build guard** — fails build if placeholder key in production
- [x] **Rate limiting ON by default** in production
- [x] **Readiness probe** (`/_ready`) — DB + Redis health checks
- [x] **Redis resilience** — retry strategy, timeouts, reconnect logging

### Cabildeo & Navigation (Day 6)
- [x] **Cabildeo in Drawer/LeftNav** — promoted to first-class navigation
- [x] **BackButton fallback** — custom escape routes (Communities → Base)
- [x] **Advanced demo seeding** — 20 users, 20 cabildeos, 200+ votes, 80+ posts
- [x] **Mock data fallback** — `USE_MOCK_DATA` for dev mode
- [x] **Phase badges on Policy cards** — vote counts + position counts
- [x] **Community link in detail** — navigable community pill
- [x] **Related cabildeos** — same-community suggestions
- [x] **Optimistic vote updates** — instant UI feedback with rollback
- [x] **Position invalidation** — tab stays fresh after voting
- [x] **Race condition fix** — state reset keyed by URI

### Political Identity & MyBase Redesign (Day 7)
- [x] **MyBase tabbed layout** — PagerWithHeader with Resumen | Votos | Comunidades
- [x] **MyBase in Drawer/LeftNav** — direct access from main navigation
- [x] **CompassMini widget** — 3×3 grid with party dots + position label
- [x] **Political affiliation flow** — party selection + compass position
- [x] **Party→Ninth auto-sync** — changing party updates compass automatically
- [x] **Single party restriction** — only one party at a time
- [x] **Manual vs Suggested indicator** — badge/chip showing ninth origin
- [x] **Flair persistence** — stored in AsyncStorage, restored on launch
- [x] **VoteAnalysis empty state CTA** — actionable "Browse policies to vote →"
- [x] **CompassScreen honest stats** — party distribution breakdown, no fake numbers
- [x] **AffiliationChangeModal** — confirmation dialog for position changes

---

## Phase 1: Post-MVP Performance & Scalability
Focus on ensuring the platform can handle thousands of concurrent participants and millions of records.
- [ ] **Advanced Indexing**: Audit and optimize all PARA namespace indexers (specifically community memberships and large-scale voting tallies).
- [ ] **Database Partitioning**: Plan for partitioning high-volume tables like `cabildeo_vote` and `para_policy_vote`.
- [ ] **Caching Hardening**: Circuit breaker for Redis failures; fallback to in-memory LRU.
- [ ] **Pagination Hardening**: Standardize cursor-based pagination across all PARA routes to prevent deep-paging performance degradation.

## Phase 2: Security & Governance Hardening
Move from basic type safety to protocol-level verification.
- [ ] **Record-level Authorization**: Implement strict validation ensuring only community creators/moderators can publish governance updates.
- [ ] **Temporal Eligibility**: Enforce voting eligibility based on membership status *at the time of the event creation*, not just current status.
- [ ] **Custom Rate Limits**: XRPC rate limits specific to PARA namespaces (community join, vote, proposal creation).
- [ ] **Audit Trail**: Create a verifiable audit log for all critical governance actions (moderator changes, state transitions).
- [ ] **Secret Manager Integration**: Move JWT secret, admin password, and PLC rotation key out of plain env vars.

## Phase 3: UI/UX & Resiliencia
Improve the user experience and error handling in the mobile client.
- [ ] **Age Assurance Re-enablement**: Restore `useAgeAssuranceState()` logic + implement PDS endpoints.
- [ ] **Polished Auth UX**: Replace generic error states with helpful login/role-specific prompts when accessing protected routes.
- [ ] **Empty State Excellence**: Design and implement high-quality "no results" views for new governance filters and empty feeds.
- [ ] **Analytics & Tracking**: Implement privacy-preserving event tracking to understand user engagement with civic features.

## Phase 4: Infrastructure & Ops
Prepare for real-world deployment.
- [ ] **CI/CD Workflows**: Fork and adapt GitHub Actions from `bluesky-social/*` org.
- [ ] **Observability**: Prometheus metrics, structured logging, distributed tracing beyond Datadog.
- [ ] **Postgres Migration**: Plan migration path from SQLite to PostgreSQL for horizontal scaling.
- [ ] **Self-Hosted OTA**: Deploy EAS Update or custom update server.

## Phase 5: Decentralized Verification (Long Term)
The ultimate goal of decentralized digital democracy.
- [ ] **ZKP Verification**: Integration with official identification systems (e.g., INE) using Zero-Knowledge Proofs to preserve user privacy.
- [ ] **Trust-less Tallies**: Move towards verifiable, trust-less vote counting mechanisms.
- [ ] **Global Scaling**: Adapt the protocol for international use, supporting diverse pluralistic democratic models.

---
*Note: This roadmap is a living document and subject to change based on community feedback and project needs.*

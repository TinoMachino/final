# Veintiuno Roadmap

This roadmap outlines the planned development phases for the Veintiuno platform as it moves beyond its initial MVP phase towards a production-ready, decentralized civic participation engine.

## Phase 1: Performance & Scalability (Next Up)
Focus on ensuring the platform can handle thousands of concurrent participants and millions of records.
- [ ] **Advanced Indexing**: Audit and optimize all PARA namespace indexers (specifically community memberships and large-scale voting tallies).
- [ ] **Database Partitioning**: Plan for partitioning high-volume tables like `cabildeo_vote` and `para_policy_vote`.
- [ ] **Caching Layer**: Implement a robust Redis-based caching strategy for common view hydration (profiles, community lists).
- [ ] **Pagination Hardening**: Standardize cursor-based pagination across all PARA routes to prevent deep-paging performance degradation.

## Phase 2: Security & Governance Hardening
Move from basic type safety to protocol-level verification.
- [ ] **Record-level Authorization**: Implement strict validation ensuring only community creators/moderators can publish governance updates.
- [ ] **Temporal Eligibility**: Enforce voting eligibility based on membership status *at the time of the event creation*, not just current status.
- [ ] **Rate Limiting**: Custom XRPC rate limits for PARA namespaces to prevent bot manipulation and resource exhaustion.
- [ ] **Audit Trail**: Create a verifiable audit log for all critical governance actions (moderator changes, state transitions).

## Phase 3: UI/UX & Resiliencia
Improve the user experience and error handling in the mobile client.
- [ ] **Polished Auth UX**: Replace generic error states with helpful login/role-specific prompts when accessing protected routes.
- [ ] **Empty State Excellence**: Design and implement high-quality "no results" views for new governance filters and empty feeds.
- [ ] **Analytics & Tracking**: Implement privacy-preserving event tracking to understand user engagement with civic features.

## Phase 4: Decentralized Verification (Long Term)
The ultimate goal of decentralized digital democracy.
- [ ] **ZKP Verification**: Integration with official identification systems (e.g., INE) using Zero-Knowledge Proofs to preserve user privacy.
- [ ] **Trust-less Tallies**: Move towards verifiable, trust-less vote counting mechanisms.
- [ ] **Global Scaling**: Adapt the protocol for international use, supporting diverse pluralistic democratic models.

---
*Note: This roadmap is a living document and subject to change based on community feedback and project needs.*

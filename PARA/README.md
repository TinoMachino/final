# PARA

PARA is the civic product layer in this workspace. It adds community, governance, and profile conventions on top of the AT Protocol stack.

## Public figure accounts

PARA now treats `f/` as the public-figure prefix and `i/` as the default individual prefix in display surfaces.

Current product meaning:

- `f/` means the account has been manually approved as a verified public figure.
- `i/` means the account is treated as a normal individual profile.

## Current backend model

We are standardizing on two records with different responsibilities:

- `com.para.identity`: PARA-owned source of truth for whether an account is approved for public-figure treatment.
- `app.bsky.graph.verification`: AppView-visible verification record used by the existing client verification pipeline.

Right now, manual verification means:

1. Review the account manually.
2. Write `com.para.identity` with `isVerifiedPublicFigure: true`.
3. Issue `app.bsky.graph.verification` through a trusted verifier account so current profile views resolve as verified.

The civic seed includes sample figure accounts and a seeded verifier account to support this workflow in demos.

## Why both records exist

`app.bsky.graph.verification` is what the current profile stack already understands. `com.para.identity` is the PARA-specific policy layer where we can store public-figure approval, proof references, and future verification metadata without forcing all of that into the generic verification record.

## Future plan for Mexico

The current release uses manual approval. The planned next phase for Mexico is:

- verify eligibility against Instituto Nacional Electoral credentials
- generate zero-knowledge proofs so a user can prove they are eligible without revealing their full identity
- keep PARA's `com.para.identity` record as the durable authorization state after proof verification succeeds

The goal is to verify authenticity without exposing sensitive identity documents to the public or making full identity disclosure a product requirement.

## Paused features (post-MVP roadmap)

The following features are present in the codebase but **paused for the MVP release**:

### Age Assurance

The app includes a full age-assurance subsystem (`src/ageAssurance/`) that enforces regional age-verification rules, content gating, and moderation prefs based on geolocation and birthdate. For the MVP, this system is **bypassed** — all users receive `Full` access regardless of region or verification status. This avoids blocking demo users and keeps the onboarding friction minimal while the product is being evaluated.

**Re-enablement:** Remove the MVP bypass in `src/ageAssurance/state.ts` (restore the original `useAgeAssuranceState` logic) and ensure the PDS supports the `app.bsky.ageassurance.*` lexicon endpoints.

### Discover feed

In local-dev mode the Discover/What's Hot feed is intentionally disabled (`DEFAULT_DISCOVER_FEED_URI = null`) because the feed generator is not seeded in the dev environment. The home tab falls back to the Following timeline.

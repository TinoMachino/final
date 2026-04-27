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

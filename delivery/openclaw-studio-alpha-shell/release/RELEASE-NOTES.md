# OpenClaw Studio Phase58 Release Notes

Milestone: phase58 operator review loop / reviewer queues / acknowledgement state / escalation windows / closeout windows / deeper cross-window observability / local-only multi-window shared-state review surface / docs / smoke / package / release-plan / UI / shared data closeout

## Highlights
- operator review board now turns the earlier review-only approval pipeline into a clearer operator-facing loop with explicit stage ownership, reviewer queues, acknowledgement state, and cross-links back into trace and window review surfaces
- release decision handoff now keeps the reviewer baton explicit between approval, lifecycle, rollback, and final decision stages while surfacing acknowledgement state and escalation windows without enabling any live signing, publish, or host-side execution
- review evidence closeout now exposes sealing state, sealed evidence, pending evidence, closeout windows, and reviewer notes as first-class local-only review artifacts instead of burying closeout posture inside larger release metadata
- attestation operator approval orchestration now turns phase53 approval routing contracts into reviewer baton sequencing, approval quorum timing, and orchestration closeout paths without dispatching any live approval or execution for real
- promotion staged-apply release decision enforcement lifecycle now turns phase53 enforcement contracts into lifecycle checkpoints, reviewer baton transitions, and expiry closeout without applying any live promotion for real
- rollback cutover publication receipt settlement closeout now turns phase53 receipt closeout contracts into settlement ledgers, receipt closeout acknowledgements, and recovery-ready closeout evidence without mutating any live publish state

## Current posture
- still local-only
- still not an installer
- still no real publish/upload/sign/notarize actions

Generated: 2026-04-06T13:34:37.011Z

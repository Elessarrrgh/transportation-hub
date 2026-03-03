# Transportation Hub: Contributor and Agent Guide

This repository is the content directory for convention transportation pages used on Squarespace.
Its purpose is to store editable source content, generate machine-readable JSON artifacts, and provide shared snippet/template references.

## Primary Purpose

- Maintain show data in human-editable `JSONC` with comments.
- Generate clean `JSON` for runtime loading.
- Keep path-based redirects stable so Squarespace-injected loaders can resolve content reliably.

## Source of Truth

- Authoritative files: `shows/*/*.jsonc`
- Generated artifacts: `config/show-content/*/*.json`

Rules:

- Edit `shows/*/*.jsonc` first.
- Treat `config/show-content/*` as build output (immutable in normal workflow).
- Only edit generated JSON directly in exceptional emergency situations.

## Build and Deployment Model

- GitHub Actions workflow: `.github/workflows/jsonc-build.yml`
- Trigger branches: `test` and `main`
- Action behavior:
  - Finds `.jsonc` files under `config` and `shows`
  - Strips comments
  - Writes `.json` to `config/show-content/...` preserving structure
  - Commits generated JSON back to the same branch

Current operational note:

- `main` is the actively used branch for live work.
- `test` exists but may be temporarily inactive depending on Squarespace staging availability.

## Runtime Integration Notes

- Squarespace header-injected scripts consume `config/content-directory.json` on page load.
- Redirect/path fields are sensitive and should be treated as high-risk change areas.
- Schema compatibility is strict: do not rename/remove existing keys without explicit approval.
- Suggested pattern for future schema changes: additive optional keys first.

## Required Show Files

Each show should have at minimum:

- `<show>-content.jsonc`
- `<show>-hotels.jsonc`
- `<show>-schedule.jsonc`

## Route Key Conventions

Standard route keys across shows:

- Numeric routes (`"1"`, `"2"`, etc.) for shuttle routes.
- `"w"` for walking route data (commonly used).
- `"x"` reserved for future placeholder/non-service needs.

Route numbering is expected to be clear and user-friendly.
Avoid skipping numbers unless there is a deliberate operational reason.

## Flight Info Caveat

Flight widget implementation on live sites has evolved.
Do not assume older repo examples are canonical without confirming the latest pattern first.

## Safe Change Policy

Before changing sensitive behavior:

- Prefer a safe test environment first (test branch/repo or equivalent sandbox).
- Batch low-risk fixes into a review queue.
- Get approval before applying queued fixes.
- For content inconsistencies (for example missing expected fields), report findings before auto-correction.

## Manual Review Status

There is currently no automated schema/link validation pipeline.
Review is manual.
Contributors and agents should perform explicit sanity checks and provide clear change summaries.

## How To Keep This Guide Useful

When to update this document:

- Workflow changes (branch usage, deployment flow, CI behavior)
- Schema contract changes
- New required files or route conventions
- New validation tooling or quality gates

How to update:

- You can edit this file directly for quick notes.
- If you prefer, ask your coding agent to update it so wording and structure stay consistent.
- Best practice: update this file in the same PR/commit that changes the workflow or schema.

## Recommended Collaboration Contract for Agents

Agents working in this repo should:

- Preserve schema unless explicitly approved.
- Avoid risky redirect/path changes without staged testing.
- Queue safe fixes and request batch approval.
- Surface assumptions explicitly when context is unclear.
- Prefer minimal, reversible changes with clear file-level diffs.

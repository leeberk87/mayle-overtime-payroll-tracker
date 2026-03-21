# Project Context for Claude Code

## What this app is
A pay tracker for our nanny, built on base44 (React-based platform).
Tracks overtime hours and calculates total monthly pay based on:
- Fixed monthly base salary
- Transport allowance
- Overtime hours × hourly rate
- Expense reimbursements

This is a focused v1 for personal family use, intended to become a polished iOS app,
then later a generic commercial SaaS product.

## What this app is NOT
A focused pay tracker — not a full nanny management platform. Do not suggest
scheduling, task management, or other scope expansions unless asked.

Currency: Israeli Shekel (₪). Do not suggest currency changes or localization.

## Tech stack
- Built with base44.com (React under the hood)
- GitHub is the source of truth — bidirectional sync with base44
- base44 pulls latest from GitHub on every new session

## Development workflow
- base44 handles visual/UI building and quick iterations
- Claude Code handles logic, backend structure, bug fixing, complex features
- Changes pushed to GitHub are automatically picked up by base44

## ⚠️ Files to treat with caution
Do NOT restructure or make unnecessary changes to:
- `App.jsx` — defines all routes and app structure
- `index.html` — critical HTML structure and script loading
- `functions/*.ts` — Deno serverless backend functions; changes affect live notification
  logic and cannot be visually previewed before deploying

Any edits to these must follow standard React and HTML best practices.

## Responsive design intent
The app is currently mobile-first (512px max-width). It needs to scale to iPad and desktop.
Long-term plan is native iOS/Android via Capacitor wrapping the existing web app.
Do not add features that break on larger screens.

## Current focus / known issues
- Basic features are breaking as complexity increases
- Backend logic needs better structure and organisation
- Priority: stabilise existing functionality before adding new features

## Git workflow
Always develop on a dedicated `claude/` branch. Never commit directly to main.
All changes are reviewed as pull requests before merging.

## Ground rules
- I have no coding background — explain changes clearly in plain English
- Flag any risks before making changes, especially to core files
- Prefer simple, readable code over clever solutions
- Always explain what a change does and why before implementing it

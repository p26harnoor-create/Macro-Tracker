# Macro-Tracker

A desk-briefing website on India × US macro: a live market dashboard plus deep dives on inflation, rates, FX, fertilizer, flows, the Fed, the Treasury long end and the causal chains that connect them. Static HTML — no framework, no build step — hosted on GitHub Pages.

Live site (after enabling Pages): `https://<your-username>.github.io/Macro-Tracker/`

## Structure

| File | What it is |
|---|---|
| `index.html` | Dashboard (live tiles), five things that matter, chapter list |
| `india.html` | §2.1–2.10 — RBI, inflation, fertilizer/NIPU, USD/INR, FCNR(B), bonds, flows, capex, trade deal, oil |
| `us.html` | §3.1–3.8 — Fed, long end & term premium, fiscal, inflation, labour, dollar, equities, gold |
| `linkages.html` | Mechanism chains, feedback loops, cyclical vs structural, bull/bear/trigger, trade framings |
| `watch.html` | Calendar, morning checklist, thresholds, inflation dashboard, source hierarchy |
| `cheatsheet.html` | 30-second answers, key numbers, glossary |
| `assets/style.css`, `assets/app.js` | Shared styling; tabs, TOC, expand-all, search, dashboard rendering |
| `data/quotes.json` | Market data written by the GitHub Action (do not edit by hand) |
| `data/manual.json` | Values with no free feed (India 10Y, repo, Fed funds, CPI, WPI, reserves) — **edit this** |
| `scripts/fetch_quotes.py` | Pulls quotes from Yahoo Finance via `yfinance` |
| `.github/workflows/update-quotes.yml` | Runs the script every 30 min on weekdays and commits `quotes.json` |

Every topic section has tabs — **Summary / Deep dive / Mechanism / Watch** — and an **Expand all** button to read straight through. Links can target a tab: `india.html#in-inflation/mech`.

Labels: **FACT** = sourced data · **VIEW** = interpretation, not forecast · **ADDED** = topics built from current reporting rather than the original research chat.

## Deploy (one time, ~2 minutes)

1. Push these files to the `main` branch of the repo.
2. **Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main` / `(root)` → Save.** The site appears at the URL above within a minute or two.
3. **Settings → Actions → General → Workflow permissions → "Read and write permissions" → Save.** (The quotes workflow commits to the repo.)
4. **Actions tab → "Update market quotes" → Run workflow.** The first run replaces the seed values with live data. After that it runs on its own schedule.

That is it. No secrets or API keys are needed.

## Keeping it current

### Market data
Automatic. The Action runs every 30 minutes, 03:00–21:00 UTC Mon–Fri (India open through US close) and once Saturday morning. Yahoo data is delayed and indicative. If a ticker fails, the last good value is kept and flagged "stale".

Values Yahoo does not carry (India 10Y, policy rates, CPI/WPI prints, FX reserves) live in `data/manual.json`. Update the `value` and `asof` fields when a new print lands.

### Content
Each section is a self-contained `<section class="section" id="…">` block. To update a topic, edit its panels, refresh the sources line, and bump the dates in the page hero.

### Using Claude Code to update it
Open the repo in Claude Code (terminal: `cd Macro-Tracker && claude`, or claude.ai/code on the web) and give it a scoped prompt. For example, after the RBI decision:

```
Update india.html §2.1 (id="in-rbi") with today's RBI MPC decision.
Preserve the section's structure (Summary / Deep dive / Mechanism / Watch tabs).
Add: the repo rate decision and vote, the stance, the updated FY27 CPI and GDP paths,
and key governor commentary. Mark sourced statements with the FACT badge and
interpretation with the VIEW badge. Update the key-number tiles at the top of the
section, the "Five things" list on index.html, data/manual.json (repo_rate), and the
calendar on watch.html. Cite RBI's press release as the primary source.
Do not change unrelated sections.
```

Or for a monthly data update:

```
Update india.html §2.2 (id="in-inflation") with the September CPI (MoSPI, 12 Oct) and
WPI (DPIIT, 14 Oct). Replace August figures with September in the key-number tiles,
add a short "What changed" paragraph comparing to August, update data/manual.json
(india_cpi, india_wpi), and refresh the thresholds table on watch.html. Keep the
analytical framework (five shocks, three stages, CPI–WPI gap) intact.
```

## Adding a topic
Copy any `<section class="section">` block, give it a new `id` (prefix `in-`, `us-`, `lk-`, `w-`, `cs-`), add a line to the page's sidebar `<aside class="toc">`, and renumber the `§` labels if needed.

## Credits
Research framework from a ChatGPT deep-dive conversation (6 Oct 2026) on Indian inflation, the dollar/rupee and fertilizer policy, extended with current reporting (RBI, MoSPI, PIB, Fed, BLS, Reuters, WSJ, Bloomberg and others — sources are linked at the bottom of each section). Layout inspired by the desk-briefing format. Not investment advice.

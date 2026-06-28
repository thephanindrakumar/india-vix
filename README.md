# India VIX Dashboard

Static GitHub Pages dashboard for India VIX intraday data, with NIFTY 50 index bars stored alongside it for movement comparisons.

## Project structure

```text
src/
  app/                  App shell and deploy-time config
  features/vix/         India VIX dashboard feature
    api/                Static JSON loading hook
    components/         Dashboard UI pieces
    utils/              Formatting and statistical calculations
    types.ts            Data contracts for the JSON file
  lib/                  Shared frontend utilities
scripts/
  update_vix_data.py    Weekly CLI entrypoint
  vix_data/             yfinance fetch, transform, schema, and storage modules
public/data/
  india-vix.json        Static dashboard dataset
.github/workflows/
  pages.yml             GitHub Pages deployment
```

## Run locally

```bash
bun install
bun run dev
```

## Market chat

The chat panel uses OpenRouter in bring-your-own-key mode. Paste an OpenRouter API key in the panel; the key is stored only in the browser `sessionStorage` and is not written to the repository or JSON data file.

Chat answers are generated from the stored India VIX and NIFTY 50 interval data in `public/data/india-vix.json`.
Before calling OpenRouter, the browser builds a small filtered context from the question: selected instrument, interval, metric family, and any threshold. It also sends a bounded rolling conversation window so follow-up questions can refer to earlier answers. It does not send the full raw JSON dataset for every question. The chat context derives daily opening moves from the intraday bars, so questions like "which days did open-to-15m move more than 7.5%" can be answered from the existing JSON without storing a separate daily file.

## Update data

Install Python dependencies once:

```bash
python3 -m pip install -r requirements.txt
```

Fetch and upsert the latest 1 minute, 5 minute, 15 minute, and 1 hour India VIX and NIFTY 50 index data:

```bash
python3 scripts/update_vix_data.py
```

The updater writes `public/data/india-vix.json`. It keeps the existing top-level `series` as India VIX for dashboard compatibility and also stores instrument-specific data under `instruments.india_vix.series` and `instruments.nifty_50.series`. Commit that JSON file and push to `main`; GitHub Pages will rebuild the static dashboard automatically.

Yahoo Finance limits intraday history retention. Run the script weekly or more often so 1 minute observations are not missed.

## Build

```bash
bun run build
```

## Contribution status

This project is not accepting outside contributions right now.

# FubolClu

Standings, fixtures and scorers for Argentine football: Liga Profesional, Primera Nacional and Copa Argentina.

Live at [fubolclu.vercel.app](https://fubolclu.vercel.app).

![Home page](docs/home.png)

Every page takes the colours of one team: whoever tops the table you're looking at, the club on a team page, the home side on a match page. Along with the zone tables it works out the annual table and the relegation averages, which the data provider doesn't have, and one page lists who currently holds each title, Libertadores place and relegation spot.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind, Drizzle on Postgres, Motion. Vitest and Playwright for tests.

## How the data works

Data comes from [Highlightly](https://highlightly.net). Its free plan allows 100 requests a day, so the site never calls it. A script (`pnpm sync`), run from GitHub Actions, decides which calls are worth making and writes the results to Postgres. Pages only read the database.

The sync counts its requests per day and stops at 90. Match lists and standings are refreshed once a day, a match in play costs one page of the list, and whatever is left of the budget goes to match details (goals, cards, stats), newest first. A season is about 1,200 matches, so a new database takes around two weeks to fill in the details.

Tables are computed from match results in `src/lib/standings`. The tests compare them with the provider's own zone tables for 2026.

The competition format changes every year, so it lives in config: `src/config/seasons`.

## Running it

You need Node 22, pnpm and a Postgres database.

```sh
pnpm install
cp .env.example .env    # DATABASE_URL and HIGHLIGHTLY_API_KEY
pnpm db:migrate
pnpm db:seed            # 2024 and 2025 points, for the averages table
pnpm sync               # the first run loads fixtures and standings
pnpm dev
```

`pnpm sync --dry-run` prints the calls the next run would make without making them.

## Tests

```sh
pnpm test    # unit tests
pnpm e2e     # Playwright, needs a database with data
```

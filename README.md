# FubolClu

Argentine football standings, fixtures and scorers.

## Development

```sh
pnpm install
cp .env.example .env   # then fill in DATABASE_URL and HIGHLIGHTLY_API_KEY
pnpm db:migrate        # apply migrations
pnpm db:seed           # 2024 and 2025 points for the averages table
pnpm sync --dry-run    # print the API calls the next sync would make
pnpm dev               # http://localhost:3000
pnpm test              # unit tests
pnpm e2e               # Playwright
pnpm lint && pnpm typecheck
pnpm format
```

## Data

`pnpm sync` pulls from the Highlightly API into Postgres and runs every 30 minutes in GitHub Actions
(`.github/workflows/sync.yml`, secrets `DATABASE_URL` and `HIGHLIGHTLY_API_KEY`). It stays under 90
requests per UTC day. The site only reads Postgres.

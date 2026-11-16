# FubolClu

Argentine football standings, fixtures and scorers.

## Development

```sh
pnpm install
cp .env.example .env   # then fill in DATABASE_URL
pnpm db:migrate        # apply migrations
pnpm dev               # http://localhost:3000
pnpm test              # unit tests
pnpm e2e               # Playwright
pnpm lint && pnpm typecheck
pnpm format
```

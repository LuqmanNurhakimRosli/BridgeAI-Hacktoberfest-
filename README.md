# ASEAN BridgeAI

Gemma 4-powered, mobile-first ASEAN startup partnership assistant.

Status: backend P0 work in progress on branch `feat/backend-matching`.

## Backend setup

```bash
npm install
cp .env.example .env.local   # then add your OpenRouter key
npm test
npm run typecheck
```

Routes live in `src/app/api/`. Shared API types and validation live in `src/lib/schemas.ts`.
Demo data is fictional and labelled `synthetic_demo`.

# Repository Guidelines

This project delivers the Importadora F&D storefront via Next.js 15 (App Router) plus Firebase Functions for transactional tasks.

## Project Structure & Module Organization
- `importadora-fyd-react/src/app` hosts route segments; folder names map to URLs such as `/producto/[id]` and `/admin`.
- Shared UI lives in `src/components` (`components/ui` for primitives, `components/home` for landing widgets); stateful logic sits in `src/hooks`, `src/context`, and utilities in `src/lib`.
- Static assets stay in `public`, styling tokens in `src/styles`, and automation scripts in `src/scripts`.
- Firebase automation code resides in `functions/src`; TypeScript emits to `functions/lib` before deployment.

## Build, Test, and Development Commands
Front-end commands (run inside `importadora-fyd-react/`):
```
npm install
npm run dev        # Next.js + Turbopack
npm run build      # production build and type checks
npm run lint       # ESLint with Next.js config
npm run analyze    # bundle analyzer build
```
Firebase commands (run inside `functions/`):
```
npm install
npm run build      # TypeScript → lib
npm run serve      # emulator for Cloud Functions
npm run deploy     # deploy updated functions
```

## Coding Style & Naming Conventions
- TypeScript throughout; prefer explicit interfaces and guard unknown data.
- Use two-space indentation, single quotes, and tidy imports—ESLint enforces React, Next.js, and accessibility rules.
- Components use PascalCase (`ProductCard.tsx`), hooks begin with `use` (`useCart.ts`), contexts end with `Provider`, and Firebase callable names stay camelCase.
- Tailwind classes follow a layout → color → state order to keep TSX readable.

## Testing Guidelines
- `npm run lint` is the required pre-push gate; keep the codebase warning-free.
- Add focused tests or scripts under `importadora-fyd-react/tests` when introducing risky logic, and document manual coverage in PR notes.
- Validate checkout, authentication, and admin flows in `npm run dev`; share screenshots or short recordings for regressions.

## Commit & Pull Request Guidelines
- Mirror the history format: capitalized prefix plus concise summary (`Fix: Ajustar carrusel móvil`).
- Reference related tickets and capture user impact or rollout notes in the body.
- PRs list verification steps (`npm run lint`, key manual paths), link issues, and attach screenshots or GIFs for UI updates.

## Security & Configuration Tips
- Keep secrets in local `.env` files; required keys and checklists live in `VARIABLES_VERCEL.md` and `SECURITY.md`.
- Keep `firestore.rules`, `storage.rules`, and `functions/src` in sync; deploy with `firebase deploy --only firestore:rules,storage,functions` after changes.
- Never commit generated customer exports (e.g. `zidjM1IW/`) or logs containing PII.

# ListeKutusu contributor guide

## Product direction

- Keep the product focused on a desktop-first social music discovery experience.
- Preserve correct Turkish characters in all user-facing copy.
- Use the shared design system and existing components before adding new styles.
- Do not work on mobile-specific layouts unless the user explicitly asks for it.

## Data and secrets

- Never commit `.env`, database files, logs, backups, generated screenshots, or session data.
- Do not replace or reset a local database unless the user explicitly requests it.
- Use `.env.example` only for documented placeholder values.

## Validation cadence

- Small CSS or copy edits: inspect affected files and run a focused typecheck when needed.
- Narrow component changes: run only the related tests.
- API or business-logic changes: run focused unit tests and typecheck.
- Accumulate roughly 4-6 development steps before running lint and broader checks.
- Run production build and browser checks only after a larger batch or when diagnosing a failure.
- Do not restart a working development server unnecessarily.

# ListeKutusu contributor guide

## Product direction

- Keep the product desktop-first: music, TV, film, books, games and shared-interest communities.
- Develop communities in phases; independent forum development is frozen, but existing forum content and routes must be preserved.
- Preserve correct Turkish characters in all user-facing copy.
- Use the shared design system and existing components before adding new styles.
- Preserve the cyan/green brand identity and blue-tinted dark surfaces. UI skills
  advise structure and accessibility; their aesthetic defaults do not override
  user preferences. Before broad restyles, preserve the current and previous
  source versions and review screenshots; avoid blanket palette replacement.
- Do not work on mobile-specific layouts unless the user explicitly asks for it.
- Treat the dark desktop experience as the active product scope. Light theme and
  mobile validation are deferred milestones.

## Context loading order

- Start with `PROJECT_STATUS.md` and `ROADMAP.md` instead of scanning the full
  repository.
- Read `DESIGN_SYSTEM.md` only for shared UI work and
  `GAMES_DESIGN_SYSTEM.md` only for game work.
- Read `ARCHITECTURE.md` for data/API boundaries and `DECISIONS.md` before
  changing an established product or technical decision.
- Do not read `docs/archive/` during normal development. It is historical
  reference only.
- Update `PROJECT_STATUS.md` after a milestone, not after every small edit.
- The user requested regular, genuine Git commits for the portfolio. After a
  coherent verified milestone, inspect the diff and commit the vetted scope.
  Use truthful messages and dates; never create empty or backdated activity.
  Do not bundle unrelated changes or generated screenshots. Push only to the
  verified, user-approved repository/account; never assume the old origin is
  still the intended target. Check repository safety before staging/publishing.
- Keep completed roadmap history out of active context; archive it when useful.

## Data and secrets

- Never commit `.env`, database files, logs, backups, generated screenshots, or session data.
- Do not replace or reset a local database unless the user explicitly requests it.
- Use `.env.example` only for documented placeholder values.

## Validation cadence

- Prefer longer cohesive sessions: finish several related implementation steps,
  focused verification and documentation before handing back. Do not ask for
  confirmation for routine in-scope implementation choices; report material
  assumptions and product decisions in the handoff. Spending, publishing,
  destructive data operations and other meaningful scope expansions still
  require the appropriate user authority.

- Small CSS or copy edits: inspect affected files and run a focused typecheck when needed.
- Narrow component changes: run only the related tests.
- API or business-logic changes: run focused unit tests and typecheck.
- Accumulate roughly 4-6 development steps before running lint and broader checks.
- Run production build and browser checks only after a larger batch or when diagnosing a failure.
- Do not restart a working development server unnecessarily.
- Follow the command matrix in `TESTING.md`; mobile and light-theme browser
  matrices remain disabled until their milestones are resumed.

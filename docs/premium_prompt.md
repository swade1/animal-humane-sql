You are my senior coding assistant.

Goal (one sentence):
Fix whitespace-only data diffs from scraped dog records so they do not create false history events.

Scope (strict):
- Only touch scraper normalization and comparison logic.
- Do not change UI/components.
- Do not add new dependencies.
- Keep changes minimal and localized.

Codebase context:
- Language/runtime: TypeScript, Node, Supabase.
- Relevant files:
  - src/utils/scraper.ts
  - src/utils/check-adoptions-api.ts

Current issue:
- Scraped names/locations sometimes include trailing spaces (e.g., "Sly ").
- This triggers false `name_change` or `location_change` records.

Required behavior:
1) Trim leading/trailing whitespace from scraped string fields before comparison and DB writes.
2) Prevent whitespace-only changes from writing to dog_history.
3) Preserve all existing logic for status/adoption handling.

Output format (important for cost):
- Return only:
  1) A 4-8 bullet implementation plan.
  2) Unified diffs for changed files only.
  3) A brief verification checklist (max 5 bullets).
- No long explanations.
- No full-file dumps.

Acceptance criteria:
- "Lola Bunny " becomes "Lola Bunny" before save.
- Existing "Sly " in scrape input no longer triggers false name_change.
- No TypeScript errors introduced.

Execution constraints:
- Ask clarifying questions only if absolutely blocking; otherwise proceed with best assumptions.
- Stop after first complete pass; do not propose optional enhancements.

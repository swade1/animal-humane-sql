# Premium Request Decision Rubric

Goal: reduce premium request usage by 30–50% without slowing delivery.

## Core Rule
Use premium only for high-impact, high-uncertainty work. Use default for everything mechanical, repeatable, or low-risk.

## 1) 30-Second Task Triage
- Use **Default** when the task is simple, repetitive, low-risk, or mostly formatting/boilerplate.
- Use **Premium** when the task is ambiguous, risky, cross-cutting, or decision-heavy.
- If unsure, start with default; escalate only if blocked after one solid attempt.

## 2) Quick Scoring (0–10)
Score each category:
- **Complexity**: simple `0` / moderate `1` / complex `2`
- **Business impact**: low `0` / medium `1` / high `2`
- **Risk if wrong**: low `0` / medium `1` / high `2`
- **Scope breadth**: single file `0` / module `1` / system-wide `2`
- **Time sensitivity**: none `0` / moderate `1` / urgent `2`

Decision thresholds:
- **0–4** → Default
- **5–6** → Lead/owner judgment
- **7–10** → Premium

## 3) Prompt Hygiene (Required)
Before any paid request:
- Include objective, constraints, relevant files, errors, and success criteria in one prompt.
- Ask for one output format only: plan, patch, or diff.
- Request minimal output unless deep reasoning is truly needed.
- Rewrite vague prompts once before sending.

## 4) Escalation / De-escalation Policy
- Start on default unless score is `>= 7`.
- Escalate to premium only if:
  - default output is still wrong after one refinement, or
  - blocker persists >15 minutes, or
  - production-critical risk is high.
- De-escalate back to default after the breakthrough (architecture/diagnosis done).

## 5) Budget Guardrails
- Set weekly premium caps per engineer.
- Alert at 70% usage; review at 90%.
- Track top 3 premium use cases weekly and template recurring prompts.
- Require a short “why premium” note for every premium request.

## Examples
- **Default**: formatting, CRUD boilerplate, copy edits, straightforward SQL, small isolated fixes.
- **Premium**: race conditions, security-sensitive logic, migration strategy, multi-file refactor design.

## Weekly KPI Review
- Premium request count
- Premium-to-default ratio
- Rework rate after model output
- Median time-to-merge

Target: cut premium usage by 30–50% while keeping delivery speed stable or improving.

---

## PR Checklist (Copy/Paste)
Use this in PR descriptions for tasks involving model usage:

```markdown
### Premium Request Rubric
- [ ] I triaged this task (default vs premium) before requesting.
- [ ] I scored the task (0–10) and recorded the result: `__`.
- [ ] Score threshold decision followed (`0–4` default, `5–6` judgment, `7–10` premium).
- [ ] If premium was used, I added a short “why premium” note.
- [ ] Prompt included objective, constraints, files/errors, and success criteria.
- [ ] I requested one output format only (plan/patch/diff).
- [ ] I used minimal output unless deep reasoning was required.
- [ ] I attempted default first unless score was `>=7`.
- [ ] I de-escalated back to default after the critical blocker was resolved.
```

## Optional PR Template Snippet
If you want a lightweight note block under the checklist:

```markdown
**Premium decision note:**
- Score: `__`
- Decision: `Default | Premium`
- Reason (if Premium): `__`
- Escalation trigger: `__`
```

---
mode: agent
---

# Copilot Add Issue Prompt (Enhanced)

## Purpose

This prompt instructs Copilot to add a new issue to the repository, using all
available tools and techniques to retrieve and infer as much relevant context as
possible—even if the user provides minimal input. The workflow and formatting
must mirror `CreateIssues.prompt.md`.

---

## Instructions for Copilot

1. **Start by asking the user:**

- "Please describe the issue you want to add. Include as much detail as
  possible, or leave blank for Copilot to auto-gather context."

2. **Proactively gather context:**

- If user input is minimal or blank, use all available methods (semantic search,
  file search, grep, code usage analysis, recent changes, error logs, test
  failures, etc.) to infer and retrieve relevant details about the issue.
- Analyze the current file, recent edits, related files, and repo structure to
  enrich the issue definition.
- Ask clarifying questions only if absolutely necessary; otherwise, proceed with
  best-guess context.

3. **Define the issue:**

- Synthesize a clear title, description, context, expected outcome, severity,
  and related files/features using gathered data.
- Reference any relevant code, documentation, or recent changes.

4. **Generate the issue file:**

- Create a new markdown file in `.github/issues/` named descriptively and
  uniquely.
- Use the formatting and logic of `CreateIssues.prompt.md` for consistency.
- **Embed the following process-as-code and optimal step directives into each
  issue:**
  - Copilot must operate as if given the instructions from
    `Initialize.prompt.md` and `Next.prompt.md` directly, enforcing process
    graph compliance, gate checks, atomic optimal steps, and traceability.
  - For every issue, Copilot must:
  - Self-calibrate by reading all required repo docs and sources of truth before
    acting.
  - Execute the single next most optimal, atomic step, keeping all gates passing
    and recording decisions as ADRs if non-trivial.
  - Output plan, diff summary, gate results, results, and next step at every
    iteration, autocontinuing unless paused.
  - Never bypass gates or improvise outside the process graph; always anchor
    actions in repo conventions and workflow.

5. **Output summary:**

- Summarize the added issue, confirm creation, and list the context sources
  used.
- Suggest next steps or follow-up actions if relevant.

---

## Example Workflow

1. Copilot: "Please describe the issue you want to add. Include as much detail
   as possible, or leave blank for auto-context."
2. User: [Provides minimal or no details]
3. Copilot: [Uses semantic/code search, recent changes, error logs, etc. to
   infer context]
4. Copilot: "Based on available context, here is the issue definition. Creating
   `.github/issues/6.md`."
5. Copilot: [Creates file, confirms, summarizes, and lists context sources]

---

## Logic Reference

- Use the same logic and formatting as `CreateIssues.prompt.md` for issue
  creation and file structure.
- Ensure atomic, standards-aligned steps.
- Record decisions and outputs as per repo conventions.

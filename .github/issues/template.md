# 📝 GitHub Issue Template
#
# For guidance, see [docs/vision.md](../../docs/vision.md), [runbooks/](../../runbooks/), [requirements/](../../requirements/)

## 1. Issue Type
- [ ] Bug
- [ ] Feature Request
- [ ] Enhancement
- [ ] Documentation
- [ ] Security
- [ ] Compliance
- [ ] Other: _Please specify_
<!-- Select the most relevant type. If unsure, choose 'Other' and describe. -->

## 2. Summary
> _Concise description of the issue or request. Example: "API returns 500 error on valid input"._

## 3. Context & Impact
- **Related files/modules:** <!-- e.g., api/health.ts -->
- **Environment:** (OS, browser, device, etc.)
- **Priority:** (Critical, High, Medium, Low)
- **Blast Radius:** (Who/what is affected? e.g., "All users", "Admins only")
- **Deadline/Target Release:**
<!-- Add links to relevant documentation, runbooks, or requirements if possible. -->

## 4. Steps to Reproduce / Implementation Plan
### For Bugs:
1. _Step-by-step instructions to reproduce the issue._
2. _Expected vs. actual behavior._
### For Features/Enhancements:
1. _Describe the desired outcome._
2. _Outline a proposed implementation plan._
<!-- Use numbered steps for clarity. -->

## 5. Screenshots / Evidence
> _Attach relevant screenshots, logs, diagrams, or links. Use [test results/], [coverage report], or [SARIF report] if applicable._

## 6. Acceptance Criteria
<!-- List clear, testable criteria for completion. -->

## Estimated Timeline
- **Estimated Start Date:** <!-- YYYY-MM-DD -->
- **Estimated End Date:** <!-- YYYY-MM-DD -->

## Project Metadata
- **Related Project/Milestone:** <!-- Link or name -->
- **Priority:** <!-- High / Medium / Low -->
- **Assignees:** <!-- List team members -->
- **Dependencies:** <!-- List blocking issues or PRs -->
- **Labels:** <!-- Add relevant labels (e.g., bug, enhancement, compliance, documentation) -->

## 7. Additional Notes / References
> _Links to related issues, RFCs, ADRs, documentation, or external resources._

## 8. Checklist
- [ ] Searched existing issues/discussions
- [ ] Issue reviewed for sensitive data
- [ ] Impact/risk assessed
- [ ] Linked to relevant compliance/privacy requirements
- [ ] Stakeholders notified
- [ ] CI gates considered
- [ ] Runbook updated (if needed)
- [ ] Provided logs/screenshots/evidence (if applicable)

> _Please assign appropriate labels and reviewers. Default labels: bug, enhancement, compliance, documentation._

## 9. Copilot Process-as-Code & Optimal Step Directives
> **For Copilot:**
>
> - Operate as if given the instructions from `Initialize.prompt.md` and `Next.prompt.md` directly.
> - Enforce process graph compliance, gate checks, atomic optimal steps, and traceability.
> - Self-calibrate by reading all required repo docs and sources of truth before acting.
> - Execute the single next most optimal, atomic step, keeping all gates passing and recording decisions as ADRs if non-trivial.
> - Output plan, diff summary, gate results, results, and next step at every iteration, autocontinuing unless paused.
> - Never bypass gates or improvise outside the process graph; always anchor actions in repo conventions and workflow.

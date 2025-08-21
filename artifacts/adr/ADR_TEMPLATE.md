---
id: adr-XXXX
type: decision
title: "Describe the decision succinctly"
status: proposed  # proposed | accepted | superseded | rejected
date: YYYY-MM-DD
owners: [team-name]
inputs: [rfc-XXXX, req-nfr, risk-R001]
options:
  - name: Option A
    pros: [add bullets]
    cons: [add bullets]
  - name: Option B
    pros: [add bullets]
    cons: [add bullets]
decision: Option A  # the chosen option
justification: >
  Summarize why this option was chosen. Reference evidence, metrics, or experiments that support the choice.
impacts: [service-a, service-b]
related_nodes: [D-arch, G-design]
evidence:
  perf_report: artifacts/perf/benchmark-YYYYMMDD.json
  cost_model: artifacts/cost/cost-model.xlsx
reconsider_if:
  - "error_budget.burn_rate > 1.0 for 7d"
---

## Context
- Background, goals, and constraints for this MaintAInPro decision.

## Decision
- Chosen option and rationale. List alternatives considered and why they were rejected.

## Consequences
- Implications, trade-offs, and required follow-up work.

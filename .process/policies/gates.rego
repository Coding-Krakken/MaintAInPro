package gates

# MaintAInPro gate policy: all required evidence must be present for gate to pass
allow {
  # Design gate
  input.kind == "gate" 
  input.id == "gate-design"
  input.evidence[_] == "artifacts/threat/THREAT_TEMPLATE.md"
  input.evidence[_] == "requirements/privacy.yml"
  input.evidence[_] == "requirements/compliance.yml"
  input.evidence[_] == "requirements/nfr.yml"
}

allow {
  # Implementation gate
  input.kind == "gate"
  input.id == "gate-implementation"
  input.evidence[_] == "test results"
  input.evidence[_] == "coverage report"
  input.evidence[_] == "mutation report"
}

allow {
  # Verification gate
  input.kind == "gate"
  input.id == "gate-verification"
  input.evidence[_] == "performance report"
  input.evidence[_] == "SARIF report"
  input.evidence[_] == "audit log config"
}

allow {
  # Release gate
  input.kind == "gate"
  input.id == "gate-release"
  input.evidence[_] == "rollout plan"
  input.evidence[_] == "monitoring config"
  input.evidence[_] == "postmortem template"
}

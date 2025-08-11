# High Priority Issue: Frontend Unit Test Assertion Errors

## Problem

Many frontend unit tests are failing due to usage of invalid Chai properties
such as `toBeInTheDocument`, `toHaveTextContent`, and `toBeDisabled`. These are
not supported by Chai and should use matchers from `@testing-library/jest-dom`
or similar.

## Impact

- Reduces confidence in UI reliability
- Blocks CI/CD pipeline and PR merges
- Affects WorkOrderCard and HealthDashboard components

## Acceptance Criteria

- Replace invalid Chai assertions with correct matchers
- Ensure all affected tests pass
- Update test setup to use proper assertion libraries

## Priority

P1 (Critical)

---

### Reference

See recent test run output for details on failing assertions.

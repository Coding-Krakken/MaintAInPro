# 🧪 MaintAInPro Testing Guide

This guide outlines the testing strategies, quality standards, and coverage requirements for MaintAInPro CMMS.

## 🧩 Test Types

- **Unit Tests**: Isolate and validate individual components ([tests/README.md](../../tests/README.md))
- **Integration Tests**: Ensure modules work together as expected
- **End-to-End (E2E) Tests**: Simulate real user flows
- **Performance Tests**: Validate speed and resource usage ([Performance Guide](Performance-Guide.md))
- **Accessibility Tests**: Ensure usability for all users

## 📊 Coverage & Gates

- Target: >95% coverage ([Wiki/Home.md](Home.md))
- All PRs must pass lint, type-check, test, coverage, and security scan ([ci/check_gates.py](../../ci/check_gates.py))

## 🛠️ Tools & Frameworks

- Vitest (unit/integration)
- Playwright (E2E)
- k6 (performance)
- jest-axe (accessibility)

## 💡 Best Practices

> **💡 Tip**: Mock external dependencies for reliable tests.
> **📝 Note**: Cover edge cases and document test intent.

---
*For more details, see [tests/README.md](../../tests/README.md), [Performance Guide](Performance-Guide.md), and [Operations Guide](Operations-Guide.md).*

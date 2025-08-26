# Architecture Decision Record (ADR)

**Objective**: Generate structured ADR for architectural decisions. Ensure consistency and traceability.

## Usage
Use this prompt when making significant architectural or design decisions that need documentation.

## ADR Template

```
Create an ADR in docs/decisions/adr-{TOPIC_SLUG}.md:

# ADR: {TITLE}

## Status
{Proposed|Accepted|Deprecated|Superseded}

## Context
{Why is this decision needed? What problem are we solving?}

Current situation:
- {Current state}
- {Pain points}  
- {Constraints}

## Decision
{What did we decide to do and why?}

We will implement/use/adopt:
- {Decision point 1}
- {Decision point 2}
- {Decision point 3}

## Consequences

### Positive
- {Benefits}
- {Improved capabilities}
- {Reduced risks}

### Negative  
- {Trade-offs}
- {New risks}
- {Additional complexity}

### Mitigation Strategies
- {How to handle negative consequences}

## Implementation
- {Files to modify}
- {Dependencies to add}
- {Migration steps}

## Related ADRs
- [Related ADR](./adr-related-topic.md)

---
This ADR documents the decision to {BRIEF_SUMMARY}.
```

## MaintAInPro Specific Examples

### Example: Database Migration Strategy

```
Create an ADR in docs/decisions/adr-database-migration-strategy.md:

**Context**: Need to migrate from SQLite to PostgreSQL while maintaining zero-downtime for production users.

**Decision**: Implement dual-write pattern with feature flags for gradual rollout.

Key decisions:
- Use Drizzle ORM for database abstraction
- Feature flag controlled migration per tenant  
- Automated data consistency validation
- Rollback capability within 4 hours

**Implementation**:
- server/services/database-migration.service.ts
- config/feature-flags.ts (add migration flags)
- migrations/ (PostgreSQL schema)
- tests/integration/migration.test.ts
```

### Example: Frontend State Management  

```
Create an ADR in docs/decisions/adr-frontend-state-management.md:

**Context**: Current Redux setup is becoming complex and hard to maintain. React Query provides better server state management.

**Decision**: Migrate to React Query for server state, keep local state in components.

Key decisions:
- React Query for API data fetching and caching
- React hooks for local component state
- Remove Redux dependency over 3 sprints
- Maintain existing API contracts

**Implementation**:
- client/src/hooks/queries/ (React Query hooks)
- Remove client/src/store/ gradually  
- Update component imports
- Add error boundary for query failures
```

## Integration with MaintAInPro Processes

**ADR Numbering**: Use sequential numbers: adr-001-topic.md, adr-002-topic.md
**Review Process**: All ADRs must be reviewed in PR process
**Status Updates**: Update status when decisions change
**Cross-References**: Link related ADRs and issues
**Implementation Tracking**: Reference ADR in implementation PRs

**Template Files**:
- Use existing ADRs in artifacts/adr/ as reference
- Follow the established format and tone
- Include implementation details specific to our stack
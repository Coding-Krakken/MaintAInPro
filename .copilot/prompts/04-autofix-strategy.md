# Autofix Strategy

**Objective**: Provide systematic approach to fixing issues with minimal changes
and full validation.

## Usage

Use this prompt structure when tackling complex issues that require a strategic
approach.

## Template

````
## Change Plan (≤10 lines: intent, scope, risks, rollback)

**Intent**: {WHAT_YOU_ARE_FIXING}
**Scope**: Files to modify: {FILE_LIST}
**Risks**: {POTENTIAL_ISSUES}
**Rollback**: {HOW_TO_UNDO_CHANGES}

## Minimal Diff (unified format)

```diff
// Show only the essential changes
- old code
+ new code
````

## Validation (exact commands)

```bash
# Commands to verify the fix works
npm run type-check
npm run lint:check --max-warnings=0
npm run test -- {SPECIFIC_TESTS}
npm run build
```

## Telemetry Check (what metric/log changes & how to verify)

**Metrics Expected**: {WHAT_SHOULD_CHANGE} **Verification**:
{HOW_TO_CHECK_IT_WORKED} **Logs to Monitor**: {RELEVANT_LOG_ENTRIES}

## Docs to Update (ADR/CHANGELOG/runbook)

- [ ] CHANGELOG.md entry under "Unreleased"
- [ ] ADR if architectural decision
- [ ] README.md if user-facing change
- [ ] docs/runbooks/ if operational change

```

## MaintAInPro Examples

### Example: Fix WebSocket Connection Issue

```

## Change Plan

**Intent**: Fix WebSocket reconnection logic causing memory leaks **Scope**:
server/websocket.ts, client/src/hooks/useWebSocket.ts **Risks**: Existing
connections might drop during deployment **Rollback**: git checkout HEAD~1 --
server/websocket.ts client/src/hooks/useWebSocket.ts

## Minimal Diff

```diff
// server/websocket.ts
- connection.on('close', () => {})
+ connection.on('close', () => { cleanupConnection(connection.id); })

// client/src/hooks/useWebSocket.ts
- useEffect(() => { connectWS(); }, [])
+ useEffect(() => { connectWS(); return () => ws.close(); }, [])
```

## Validation

```bash
npm run type-check
npm run lint:check --max-warnings=0
npm run test -- tests/unit/hooks/useWebSocket.test.ts
npm run test:e2e -- --grep "WebSocket"
```

## Telemetry Check

**Metrics Expected**: WebSocket connection count should stabilize, memory usage
should not grow **Verification**: Monitor server logs for "WebSocket cleanup"
messages **Logs to Monitor**: websocket.log, memory usage metrics in
HealthDashboard

```

### Example: Database Query Optimization

```

## Change Plan

**Intent**: Optimize slow equipment query by adding proper indexes **Scope**:
migrations/add-equipment-indexes.sql, server/services/equipment.service.ts
**Risks**: Migration might take time on large datasets **Rollback**: Run down
migration: npm run db:migrate:down

## Validation

```bash
npm run db:push
npm run test -- tests/integration/equipment.integration.test.ts
# Check query performance in logs
npm run benchmark -- equipment-queries
```

## Telemetry Check

**Metrics Expected**: Equipment query response time <100ms **Verification**:
Performance monitor in admin dashboard  
**Logs to Monitor**: database-performance.log, slow query logs

```

```

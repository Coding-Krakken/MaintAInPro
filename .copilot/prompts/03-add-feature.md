# Add New Feature

**Objective**: Add new functionality while passing all quality gates. Include tests.

## Usage  
Copy this prompt when implementing new features or extending existing functionality.

## Template

```
Add {FEATURE_NAME} in {FILE_PATH} to satisfy: {SPECIFICATION}

**Requirements**:
- Follow existing code patterns in the repository
- Pass TypeScript compilation (`npm run type-check`)
- Pass linting (`npm run lint:check --max-warnings=0`)  
- Include unit tests with good coverage
- Follow the repository's testing patterns

**Architecture Alignment**:
- Frontend: React 18 + TypeScript patterns
- Backend: Express.js + Drizzle ORM patterns  
- Shared: Use types from `shared/` directory
- Testing: Vitest with Testing Library patterns

**Deliverables**:
1. Implementation following existing patterns
2. Unit tests with AAA pattern (Arrange, Act, Assert)  
3. Type definitions if needed
4. Integration with existing components/services
5. Verification that all quality gates pass

**Quality Gates**:
- `npm run type-check` (no errors)
- `npm run lint:check --max-warnings=0` (passes)
- `npm run test:run` (all tests pass)
- `npm run build` (successful build)
```

## MaintAInPro Specific Examples

```
Add QR code generation feature in client/src/components/equipment/QRCodeGenerator.tsx to satisfy: Generate QR codes for equipment tracking

**Specification**: 
- Accept equipment ID as prop
- Generate QR code containing equipment URL
- Display QR code with download option
- Handle loading and error states

**Patterns to Follow**:
- Look at existing components in client/src/components/equipment/
- Use the same loading spinner pattern as EquipmentDetailModal.tsx
- Follow error handling patterns from other components
- Use shared types from shared/types/equipment.ts
```

```
Add bulk inventory operations in server/services/inventory.service.ts to satisfy: Enable bulk import/export of inventory data

**Specification**:
- Bulk import from CSV format
- Bulk export to CSV format  
- Validation and error reporting
- Transaction support for consistency

**Patterns to Follow**:
- Follow service patterns from server/services/equipment.service.ts
- Use Drizzle transactions like in other services
- Error handling patterns from server/services/auth/
- Validation using Zod schemas from shared/
```

## Integration Points

- **Feature Flags**: Use `config/feature-flags.ts` for rollout control
- **API Routes**: Add to appropriate router in `server/routes/`
- **Database**: Use Drizzle migrations in `migrations/`
- **Frontend State**: Integrate with React Query patterns
- **WebSocket**: Use existing WebSocket service for real-time updates
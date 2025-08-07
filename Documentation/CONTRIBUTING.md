# Contributing to MaintAInPro

## Welcome Contributors! 🎉

We're excited that you're interested in contributing to MaintAInPro! This guide will help you get started with contributing to our enterprise CMMS platform.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to making participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Harassment, trolling, or discriminatory language
- Publishing private information without permission
- Professional misconduct or inappropriate behavior

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Git** configured with your GitHub account
- **PostgreSQL 13+** (optional - has in-memory fallback)
- **Code editor** (VS Code recommended)
- **Basic understanding** of TypeScript, React, and Express.js

### Development Setup

1. **Fork the Repository**
   ```bash
   # Click the "Fork" button on GitHub
   # Then clone your fork
   git clone https://github.com/YOUR_USERNAME/MaintAInPro.git
   cd MaintAInPro
   ```

2. **Set Up Upstream Remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/MaintAInPro.git
   git remote -v
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   # DATABASE_URL is optional - uses in-memory storage
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Verify Setup**
   ```bash
   # Run tests to ensure everything works
   npm run test
   
   # Check TypeScript compilation
   npm run check
   ```

## Development Workflow

### Branch Naming Convention

Use descriptive branch names that follow this pattern:

```bash
# Feature branches
feature/work-order-attachments
feature/mobile-qr-scanner
feature/advanced-analytics

# Bug fixes
fix/equipment-validation-error
fix/work-order-status-update
fix/mobile-responsive-layout

# Documentation
docs/api-documentation-update
docs/deployment-guide-enhancement

# Refactoring
refactor/storage-service-optimization
refactor/component-structure-cleanup
```

### Creating a Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name

# Push the branch to your fork
git push -u origin feature/your-feature-name
```

### Development Process

1. **Make Small, Focused Changes**
   - One feature or fix per branch
   - Keep commits atomic and focused
   - Write descriptive commit messages

2. **Write Tests**
   - Add unit tests for new functions
   - Add integration tests for API changes
   - Update existing tests if needed

3. **Follow Coding Standards**
   - Use TypeScript for type safety
   - Follow ESLint and Prettier rules
   - Write self-documenting code

4. **Test Your Changes**
   ```bash
   # Run all tests
   npm run test
   
   # Run type checking
   npm run check
   
   # Run linting
   npm run lint
   ```

## Coding Standards

### TypeScript Guidelines

1. **Always Use Types**
   ```typescript
   // ✅ Good
   interface WorkOrder {
     id: string;
     description: string;
     status: 'new' | 'in_progress' | 'completed';
     createdAt: Date;
   }
   
   function createWorkOrder(data: Partial<WorkOrder>): WorkOrder {
     // Implementation
   }
   
   // ❌ Avoid
   function createWorkOrder(data: any): any {
     // Implementation
   }
   ```

2. **Use Strict Type Checking**
   ```typescript
   // Enable strict mode in tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

3. **Prefer Interfaces Over Types**
   ```typescript
   // ✅ Good
   interface Equipment {
     id: string;
     assetTag: string;
     status: EquipmentStatus;
   }
   
   // ✅ Also good for unions
   type EquipmentStatus = 'active' | 'inactive' | 'maintenance';
   ```

### React Component Guidelines

1. **Use Functional Components with Hooks**
   ```typescript
   // ✅ Good
   const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ workOrder }) => {
     const [isExpanded, setIsExpanded] = useState(false);
     
     return (
       <Card className="work-order-card">
         {/* Component JSX */}
       </Card>
     );
   };
   
   // ❌ Avoid class components unless necessary
   ```

2. **Props Interface Definition**
   ```typescript
   interface WorkOrderCardProps {
     workOrder: WorkOrder;
     onStatusChange?: (id: string, status: WorkOrderStatus) => void;
     className?: string;
   }
   ```

3. **Custom Hooks for Reusable Logic**
   ```typescript
   // Custom hook example
   function useWorkOrders(filters?: WorkOrderFilters) {
     const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       // Fetch logic
     }, [filters]);
     
     return { workOrders, loading, refetch };
   }
   ```

### API Development Guidelines

1. **Use Zod for Validation**
   ```typescript
   import { z } from 'zod';
   
   const createWorkOrderSchema = z.object({
     description: z.string().min(1, 'Description is required'),
     type: z.enum(['corrective', 'preventive', 'emergency']),
     priority: z.enum(['low', 'medium', 'high', 'critical']),
     equipmentId: z.string().uuid().optional()
   });
   
   // Use in route handler
   app.post('/api/work-orders', (req, res) => {
     const validation = createWorkOrderSchema.safeParse(req.body);
     if (!validation.success) {
       return res.status(400).json({ 
         error: 'Validation failed',
         details: validation.error.issues 
       });
     }
     // Process valid data
   });
   ```

2. **Consistent Error Handling**
   ```typescript
   // Standard error response format
   interface ApiError {
     error: string;
     code: string;
     details?: any;
     timestamp: string;
     path: string;
   }
   
   // Error middleware
   app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
     const errorResponse: ApiError = {
       error: err.message,
       code: err.name || 'INTERNAL_ERROR',
       timestamp: new Date().toISOString(),
       path: req.path
     };
     
     res.status(500).json(errorResponse);
   });
   ```

3. **RESTful API Design**
   ```typescript
   // ✅ Good RESTful endpoints
   GET    /api/work-orders              // List work orders
   POST   /api/work-orders              // Create work order
   GET    /api/work-orders/:id          // Get specific work order
   PATCH  /api/work-orders/:id          // Update work order
   DELETE /api/work-orders/:id          // Delete work order
   
   // ✅ Good nested resources
   GET    /api/work-orders/:id/checklist     // Get checklist items
   POST   /api/work-orders/:id/checklist     // Add checklist item
   ```

### Database Guidelines

1. **Use TypeScript with Drizzle ORM**
   ```typescript
   // Schema definition
   export const workOrders = pgTable('work_orders', {
     id: uuid('id').defaultRandom().primaryKey(),
     foNumber: text('fo_number').notNull().unique(),
     description: text('description').notNull(),
     status: workOrderStatusEnum('status').notNull().default('new'),
     createdAt: timestamp('created_at').defaultNow().notNull()
   });
   
   // Type inference
   export type WorkOrder = typeof workOrders.$inferSelect;
   export type InsertWorkOrder = typeof workOrders.$inferInsert;
   ```

2. **Query Optimization**
   ```typescript
   // ✅ Good - Use indexes and selective queries
   const workOrders = await db
     .select()
     .from(workOrdersTable)
     .where(
       and(
         eq(workOrdersTable.warehouseId, warehouseId),
         eq(workOrdersTable.status, 'in_progress')
       )
     )
     .orderBy(desc(workOrdersTable.createdAt))
     .limit(20);
   
   // ❌ Avoid - Don't select all columns if not needed
   const workOrders = await db.select().from(workOrdersTable);
   ```

## Testing Guidelines

### Test Structure

1. **Follow AAA Pattern**
   ```typescript
   describe('WorkOrder Service', () => {
     it('should create work order with valid data', async () => {
       // Arrange
       const workOrderData = {
         description: 'Fix conveyor belt',
         type: 'corrective' as const,
         priority: 'high' as const
       };
       
       // Act
       const result = await workOrderService.create(workOrderData);
       
       // Assert
       expect(result).toBeDefined();
       expect(result.description).toBe('Fix conveyor belt');
       expect(result.foNumber).toMatch(/^WO-\d+$/);
     });
   });
   ```

2. **Test Categories**
   ```typescript
   // Unit tests - Test individual functions/components
   describe('formatDate utility', () => {
     it('should format date correctly', () => {
       const date = new Date('2023-12-01');
       expect(formatDate(date)).toBe('Dec 1, 2023');
     });
   });
   
   // Integration tests - Test API endpoints
   describe('Work Orders API', () => {
     it('should create work order via API', async () => {
       const response = await request(app)
         .post('/api/work-orders')
         .set(authHeaders)
         .send(workOrderData)
         .expect(201);
       
       expect(response.body.id).toBeDefined();
     });
   });
   
   // Component tests - Test React components
   describe('WorkOrderCard Component', () => {
     it('should render work order information', () => {
       render(<WorkOrderCard workOrder={mockWorkOrder} />);
       expect(screen.getByText('Fix conveyor belt')).toBeInTheDocument();
     });
   });
   ```

3. **Mock Strategy**
   ```typescript
   // Mock external dependencies
   vi.mock('../services/notification.service', () => ({
     sendNotification: vi.fn().mockResolvedValue(true)
   }));
   
   // Mock implementation
   const mockStorage = {
     createWorkOrder: vi.fn(),
     getWorkOrder: vi.fn(),
     updateWorkOrder: vi.fn()
   };
   ```

### Test Requirements

- **New Features**: Must include unit tests and integration tests
- **Bug Fixes**: Must include regression test
- **Component Changes**: Must include component tests
- **API Changes**: Must include API integration tests
- **Coverage**: Maintain minimum 90% code coverage

## Submitting Changes

### Commit Message Format

Use conventional commit format:

```bash
# Format
<type>(<scope>): <description>

[optional body]

[optional footer]

# Examples
feat(work-orders): add bulk status update functionality

fix(equipment): resolve asset tag validation error

docs(api): update authentication documentation

test(components): add WorkOrderCard component tests

refactor(storage): optimize database query performance
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **test**: Adding or updating tests
- **refactor**: Code refactoring
- **style**: Code style changes (formatting)
- **perf**: Performance improvements
- **chore**: Maintenance tasks

### Pull Request Process

1. **Prepare Your Changes**
   ```bash
   # Ensure your branch is up to date
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git merge main
   
   # Run tests and checks
   npm run test
   npm run check
   npm run lint
   ```

2. **Create Pull Request**
   - Use descriptive title and description
   - Reference related issues
   - Include testing information
   - Add screenshots for UI changes

3. **Pull Request Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Performance improvement
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Tests pass
   - [ ] Documentation updated
   
   ## Screenshots (if applicable)
   
   ## Related Issues
   Fixes #123
   ```

### Code Review Process

1. **Automated Checks**
   - TypeScript compilation
   - Test suite execution
   - Code linting
   - Security scanning

2. **Manual Review**
   - Code quality and style
   - Test coverage
   - Documentation updates
   - Security considerations

3. **Review Response**
   - Address feedback promptly
   - Make requested changes
   - Update tests if needed
   - Re-request review

## Documentation

### Documentation Requirements

1. **Code Documentation**
   ```typescript
   /**
    * Creates a new work order with the provided data
    * 
    * @param workOrderData - The work order data to create
    * @returns Promise resolving to the created work order
    * @throws {ValidationError} When required fields are missing
    * @throws {DatabaseError} When database operation fails
    */
   async function createWorkOrder(
     workOrderData: InsertWorkOrder
   ): Promise<WorkOrder> {
     // Implementation
   }
   ```

2. **API Documentation**
   - Update API documentation for new endpoints
   - Include request/response examples
   - Document error responses
   - Update OpenAPI spec if available

3. **README Updates**
   - Update feature list for new functionality
   - Add configuration options
   - Update setup instructions if needed

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep documentation up to date
- Use proper Markdown formatting
- Include diagrams for complex features

## Community

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs or request features
- **Discord/Slack**: Real-time chat (if available)
- **Email**: Contact maintainers for security issues

### Reporting Bugs

1. **Search Existing Issues**: Check if bug already reported
2. **Use Bug Report Template**: Provide all requested information
3. **Include Reproduction Steps**: Clear steps to reproduce
4. **Provide Environment Details**: OS, Node.js version, etc.

### Suggesting Features

1. **Check Roadmap**: Review planned features
2. **Create Feature Request**: Use the template
3. **Provide Use Case**: Explain why feature is needed
4. **Consider Implementation**: Suggest approach if possible

### Security Issues

For security vulnerabilities:
1. **DO NOT** create public issue
2. Email security team directly
3. Include detailed description
4. Allow time for response and fix

## Recognition

### Contributors

We recognize contributors in several ways:
- **README**: Listed in contributors section
- **Changelog**: Credited for specific contributions  
- **GitHub**: Contributor status and badges
- **Community**: Highlighted in community updates

### Maintainer Path

Regular contributors may be invited to become maintainers:
1. Consistent quality contributions
2. Good understanding of codebase
3. Helpful in code reviews
4. Active in community discussions

## Resources

### Development Resources

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React Documentation**: https://react.dev/
- **Vitest Testing**: https://vitest.dev/
- **Drizzle ORM**: https://orm.drizzle.team/

### Project Resources

- **API Documentation**: `/Documentation/API_DOCUMENTATION.md`
- **Deployment Guide**: `/Documentation/DEPLOYMENT_GUIDE.md`
- **Test Coverage**: `/Documentation/TEST_COVERAGE_REPORT.md`
- **Roadmap**: `/ROADMAP.md`

---

## Thank You! 🙏

Thank you for contributing to MaintAInPro! Your contributions help make enterprise maintenance management better for everyone.

*Last updated: August 2025*
*Contributing Guide Version: v1.3.0*

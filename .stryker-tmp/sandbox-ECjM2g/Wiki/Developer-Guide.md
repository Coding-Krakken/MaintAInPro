# 💻 Developer Guide

Welcome to the MaintAInPro developer documentation! This guide covers everything you need to know to contribute to and extend the platform.

## 🏗️ Architecture Overview

MaintAInPro follows a modern full-stack architecture optimized for maintainability, scalability, and developer experience.

### Tech Stack

```mermaid
graph TB
    subgraph "Frontend"
        A[React 18 + TypeScript]
        B[Vite Build Tool]
        C[TailwindCSS]
        D[Radix UI Components]
    end
    
    subgraph "Backend"
        E[Express.js + TypeScript]
        F[Drizzle ORM]
        G[Zod Validation]
        H[JWT Authentication]
    end
    
    subgraph "Database"
        I[PostgreSQL]
        J[Multi-tenant Design]
        K[Strategic Indexing]
    end
    
    subgraph "Infrastructure"
        L[Vercel Deployment]
        M[Edge Functions]
        N[WebSocket Support]
    end
    
    A --> E
    E --> I
    E --> L
```

### Project Structure

```
MaintAInPro/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API client functions
│   │   ├── lib/         # Utilities and configurations
│   │   └── types/       # TypeScript type definitions
│   ├── public/          # Static assets
│   └── index.html       # Entry point
├── server/              # Express.js backend
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── middleware/      # Express middleware
│   ├── utils/           # Server utilities
│   └── index.ts         # Server entry point
├── shared/              # Shared code between client/server
│   ├── schema.ts        # Database schema (Drizzle)
│   ├── types.ts         # Shared TypeScript types
│   └── validation/      # Zod validation schemas
├── tests/               # Test suites
│   ├── unit/            # Unit tests
│   ├── integration/     # API integration tests
│   ├── e2e/             # End-to-end tests
│   └── config/          # Test configurations
├── Documentation/       # Comprehensive documentation
└── scripts/             # Build and deployment scripts
```

## 🚀 Development Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: Latest version

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Coding-Krakken/MaintAInPro.git
cd MaintAInPro

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# Edit .env.local with your configuration:
# DATABASE_URL="postgresql://username:password@localhost:5432/maintainpro"
# SESSION_SECRET="your-super-secret-key"
# NODE_ENV="development"

# 4. Set up the database
npm run db:push
npm run seed

# 5. Start development server
npm run dev
```

### Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run check            # TypeScript type checking
npm run lint             # Fix linting issues
npm run format           # Format code with Prettier

# Database
npm run db:push          # Push schema changes to database
npm run db:generate      # Generate migration files
npm run seed             # Seed database with sample data

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run all tests once
npm run test:coverage    # Generate coverage report
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:e2e         # Run end-to-end tests

# Quality Assurance
npm run quality          # Run all quality checks (lint + format + test)

# Production
npm run build            # Build for production
npm start                # Start production server
```

## 🔧 Development Workflow

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/work-order-notifications

# 2. Make changes following coding standards
# 3. Add tests for new functionality
# 4. Run quality checks
npm run quality

# 5. Commit with conventional commits
git commit -m "feat(work-orders): add email notifications"

# 6. Push and create pull request
git push origin feature/work-order-notifications
```

### 2. Coding Standards

#### TypeScript Standards
- **Strict mode**: All code must pass `tsc --noEmit`
- **No `any` types**: Use proper typing or `unknown`
- **Interface over type**: Prefer interfaces for object shapes
- **Consistent naming**: PascalCase for components, camelCase for functions

```typescript
// ✅ Good
interface WorkOrder {
  id: string;
  title: string;
  status: WorkOrderStatus;
  createdAt: Date;
}

const createWorkOrder = async (data: CreateWorkOrderInput): Promise<WorkOrder> => {
  // Implementation
};

// ❌ Bad
const createWorkOrder = (data: any) => {
  // Implementation
};
```

#### React Standards
- **Functional components**: Use hooks instead of class components
- **Custom hooks**: Extract complex logic into reusable hooks
- **Prop interfaces**: Define props with TypeScript interfaces
- **Error boundaries**: Wrap components that might throw

```typescript
// ✅ Good
interface WorkOrderFormProps {
  initialData?: Partial<WorkOrder>;
  onSubmit: (data: WorkOrderInput) => Promise<void>;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ 
  initialData, 
  onSubmit 
}) => {
  // Implementation
};

// Custom hook example
const useWorkOrders = (filters?: WorkOrderFilters) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Implementation
  
  return { workOrders, loading, refetch };
};
```

#### API Development Standards
- **Schema-first**: Define Zod schemas for all inputs/outputs
- **Error handling**: Use structured error responses
- **Validation**: Validate all inputs with Zod
- **Multi-tenant**: Always include `organizationId` checks

```typescript
// Schema definition
const createWorkOrderSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  equipmentId: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

// Route handler
app.post('/api/work-orders', async (req, res) => {
  try {
    // Validate input
    const data = createWorkOrderSchema.parse(req.body);
    
    // Check permissions
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Create work order
    const workOrder = await workOrderService.create({
      ...data,
      organizationId: req.user.organizationId,
      createdBy: req.user.id,
    });
    
    res.status(201).json(workOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    console.error('Failed to create work order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 3. Testing Standards

#### Unit Tests
- **Coverage target**: >95% for new code
- **Test naming**: Descriptive test names
- **Mocking**: Mock external dependencies
- **Edge cases**: Test error conditions

```typescript
// Example unit test
describe('WorkOrderService', () => {
  describe('createWorkOrder', () => {
    it('should create work order with valid data', async () => {
      const mockData = {
        title: 'Fix broken pump',
        equipmentId: 'equipment-123',
        organizationId: 'org-123',
      };
      
      const result = await workOrderService.create(mockData);
      
      expect(result).toMatchObject({
        id: expect.any(String),
        title: mockData.title,
        status: 'open',
      });
    });
    
    it('should throw error when equipment not found', async () => {
      const mockData = {
        title: 'Fix broken pump',
        equipmentId: 'invalid-id',
        organizationId: 'org-123',
      };
      
      await expect(workOrderService.create(mockData))
        .rejects
        .toThrow('Equipment not found');
    });
  });
});
```

#### Integration Tests
- **API testing**: Test complete request/response cycles
- **Database tests**: Use test database with cleanup
- **Authentication**: Test auth flows and permissions

```typescript
// Example integration test
describe('POST /api/work-orders', () => {
  it('should create work order when authenticated', async () => {
    const token = await createTestUser();
    
    const response = await request(app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test work order',
        equipmentId: testEquipment.id,
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      title: 'Test work order',
    });
  });
});
```

#### E2E Tests
- **User flows**: Test complete user journeys
- **Cross-browser**: Test in multiple browsers
- **Mobile**: Test responsive behavior

```typescript
// Example E2E test
test('user can create and complete work order', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'test@example.com');
  await page.fill('[data-testid=password]', 'password');
  await page.click('[data-testid=login-button]');
  
  // Create work order
  await page.goto('/work-orders');
  await page.click('[data-testid=create-work-order]');
  await page.fill('[data-testid=title]', 'Test work order');
  await page.click('[data-testid=submit]');
  
  // Verify creation
  await expect(page.locator('text=Test work order')).toBeVisible();
});
```

## 🗄️ Database Development

### Schema Management

MaintAInPro uses Drizzle ORM for type-safe database operations:

```typescript
// shared/schema.ts
export const workOrders = pgTable('work_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status').$type<WorkOrderStatus>().notNull().default('open'),
  priority: varchar('priority').$type<WorkOrderPriority>().notNull().default('medium'),
  organizationId: uuid('organization_id').notNull(),
  equipmentId: uuid('equipment_id'),
  assignedTo: uuid('assigned_to'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Migration Workflow

```bash
# 1. Modify schema in shared/schema.ts
# 2. Generate migration
npm run db:generate

# 3. Review generated migration file
# 4. Apply migration
npm run db:push

# 5. Update seed data if needed
npm run seed
```

### Multi-Tenant Patterns

Always include organization-level isolation:

```typescript
// ✅ Good - includes organization filter
const getWorkOrders = async (organizationId: string) => {
  return db.select()
    .from(workOrders)
    .where(eq(workOrders.organizationId, organizationId));
};

// ❌ Bad - missing organization filter
const getWorkOrders = async () => {
  return db.select().from(workOrders);
};
```

## 🔐 Security Guidelines

### Authentication & Authorization

```typescript
// Middleware for protected routes
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = await getUserById(payload.userId);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access control
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Input Validation

Always validate inputs with Zod:

```typescript
// Define schema
const updateWorkOrderSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
});

// Validate in route
app.patch('/api/work-orders/:id', async (req, res) => {
  const updates = updateWorkOrderSchema.parse(req.body);
  // Process updates...
});
```

## 🚀 Performance Best Practices

### Frontend Optimization

```typescript
// Lazy loading
const WorkOrderDetails = lazy(() => import('./WorkOrderDetails'));

// Memoization
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransformation(item));
  }, [data]);
  
  return <div>{/* Render */}</div>;
});

// Virtualization for large lists
import { FixedSizeList as List } from 'react-window';

const WorkOrderList = ({ workOrders }) => (
  <List
    height={600}
    itemCount={workOrders.length}
    itemSize={80}
    itemData={workOrders}
  >
    {WorkOrderRow}
  </List>
);
```

### Backend Optimization

```typescript
// Database query optimization
const getWorkOrdersWithEquipment = async (organizationId: string) => {
  return db.select({
    workOrder: workOrders,
    equipment: equipment,
  })
  .from(workOrders)
  .leftJoin(equipment, eq(workOrders.equipmentId, equipment.id))
  .where(eq(workOrders.organizationId, organizationId))
  .limit(50); // Pagination
};

// Caching
const cache = new Map();
const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  
  // Auto-expire after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  
  return data;
};
```

## 📦 Contributing Guidelines

### Pull Request Process

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** following coding standards
4. **Add tests** for new functionality
5. **Run quality checks**: `npm run quality`
6. **Commit changes**: Use conventional commits
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Create pull request** with detailed description

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Examples**:
```
feat(work-orders): add email notifications
fix(auth): resolve token expiration issue
docs(api): update endpoint documentation
test(equipment): add unit tests for QR code generation
```

### Code Review Criteria

- ✅ **Functionality**: Code works as intended
- ✅ **Tests**: Adequate test coverage
- ✅ **Performance**: No performance regressions
- ✅ **Security**: No security vulnerabilities
- ✅ **Documentation**: Code is well-documented
- ✅ **Standards**: Follows coding standards

## 🔍 Debugging & Troubleshooting

### Common Development Issues

**TypeScript Errors**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run check
```

**Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql $DATABASE_URL
```

**Test Failures**
```bash
# Run specific test
npm run test -- --grep "work order creation"

# Debug mode
npm run test -- --inspect-brk
```

### Debugging Tools

**Server-side debugging**
```typescript
import debug from 'debug';
const log = debug('maintainpro:work-orders');

const createWorkOrder = async (data) => {
  log('Creating work order with data:', data);
  // Implementation
};
```

**Client-side debugging**
```typescript
// React DevTools
// Redux DevTools (if using Redux)
// Browser developer tools

// Console debugging
console.log('Component state:', { workOrders, loading });
```

## 📚 Additional Resources

### Documentation
- **[[API Reference]]** - Complete API documentation
- **[[Architecture]]** - Detailed technical architecture
- **[[Testing Guide]]** - Comprehensive testing strategies
- **[[Security Guide]]** - Security implementation details

### External Resources
- **[React Documentation](https://react.dev/)**
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)**
- **[Drizzle ORM](https://orm.drizzle.team/)**
- **[Vitest Testing](https://vitest.dev/)**
- **[Playwright E2E](https://playwright.dev/)**

---

## 🎉 Happy Coding!

You're now equipped with everything you need to contribute to MaintAInPro. Remember to:

- Follow coding standards
- Write comprehensive tests  
- Document your changes
- Ask questions when needed

**Welcome to the team! 🚀**

---

*Developer Guide last updated: January 2025*
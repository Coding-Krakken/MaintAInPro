# Database Implementation Roadmap

This roadmap outlines the comprehensive, enterprise-grade PostgreSQL database implementation for MaintAInPro CMMS, designed for scalability, performance, multi-tenancy, extensibility, and compliance. It covers schema design, migration, indexing, audit, extensibility, and operational best practices.

---

## 1. Core Principles
- **UUID Primary Keys** for all tables
- **Multi-Tenancy**: All core tables reference `organization_id`
- **Audit Fields**: `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`
- **Soft Deletes**: Use `deleted_at` for all entities
- **Extensibility**: Custom fields, plugins, entity tags
- **Full-Text Search**: tsvector columns, GIN indexes
- **Geolocation**: PostGIS extension for spatial fields
- **Referential Integrity**: Foreign key constraints everywhere
- **Indexing**: Strategic indexes for performance
- **Partitioning**: For large tables (e.g., work_orders)

---

## 2. Table Overview

### 2.1. Multi-Tenant Core
- **organizations**: Tenants, settings, branding
- **users**: Linked to organizations, roles, permissions, password hash
- **user_sessions**: JWT/refresh tokens, IP, expiry

### 2.2. Work Management
- **work_orders**: Priority, status, scheduling, assignment, FTS
- **work_order_templates**: Reusable templates
- **work_order_assets**: Many-to-many WO/assets
- **maintenance_logs**: Linked to WOs/assets
- **checklists, checklist_items, checklist_signatures**: WO completion
- **calendar_events**: Scheduling, ICS export
- **comments**: Nested, attachments, images

### 2.3. Asset & Inventory
- **assets**: Hierarchy, type, serial, location (PostGIS)
- **parts_inventory**: Stock, location, reorder points
- **work_order_parts_used**: Usage tracking
- **vendors, contractors**: External parties

### 2.4. Extensibility & Audit
- **tags, entity_tags**: Many-to-many tagging
- **activity_logs**: Full audit trail
- **custom_fields, custom_field_values**: Dynamic fields
- **plugins**: Dynamic extension loading
- **rules_engine**: Event → condition → action
- **i18n_strings**: Multilingual support
- **dashboard_metrics_cache**: Real-time dashboard
- **attachments**: S3/Cloudinary/local
- **notifications**: User/org notifications

---

## 3. Schema Design Details
- **All PKs**: UUID v4, generated in-app or by DB
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` (nullable)
- **Soft Deletes**: Filtered in all queries
- **Foreign Keys**: `ON DELETE SET NULL` or `ON DELETE CASCADE` as appropriate
- **Indexing**: GIN for FTS, B-tree for FK, composite for queries
- **Partitioning**: By org or date for large tables (e.g., work_orders)
- **PostGIS**: For asset locations, spatial queries
- **Custom Fields**: EAV model for flexibility
- **Audit**: activity_logs for all sensitive changes

---

## 4. Migration & Seeding
- Use Drizzle ORM or Prisma for migrations
- Seed scripts for fake data, test orgs, users, assets, WOs
- Migration versioning and rollback support

---

## 5. Operational Best Practices
- **Connection Pooling**: Use PgBouncer
- **Read Replicas**: For reporting, analytics
- **Archival**: Move old WOs/logs to cold storage
- **Monitoring**: pg_stat_statements, slow query log
- **Backups**: Automated, encrypted, multi-region
- **Security**: Principle of least privilege, encrypted credentials

---

## 6. Extensibility & Future-Proofing
- **Plugin System**: Register new tables, hooks, forms
- **Dynamic Forms**: Custom fields per org/entity
- **White-Labeling**: Org-specific settings, theming
- **Multi-Region**: Data residency, compliance

---

## 7. Example Table: work_orders
```sql
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT,
  scheduled_for TIMESTAMP,
  assigned_to UUID REFERENCES users(id),
  requested_by UUID REFERENCES users(id),
  tsv tsvector,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
CREATE INDEX idx_work_orders_org ON work_orders(organization_id);
CREATE INDEX idx_work_orders_tsv ON work_orders USING GIN(tsv);
```

---

## 8. Full-Text Search & Geolocation
- Use `tsvector` columns and GIN indexes for FTS on WOs, assets, comments
- Enable PostGIS for spatial fields (assets, vendors, etc.)

---

## 9. Compliance & Security
- **Audit Logs**: All sensitive changes
- **GDPR**: Data export/delete endpoints
- **Encryption**: At rest and in transit
- **Access Control**: Row-level security (if needed)

---

## 10. Optimization for Scale
- Partition large tables
- Use connection pooling
- Archive old data
- Monitor and tune queries

---

## 11. Migration Strategy

### 11.1. Current State Assessment
**Existing Infrastructure:**
- ✅ **DatabaseStorage Class**: Fully implemented (`server/dbStorage.ts` - 760 lines)
- ✅ **Neon PostgreSQL**: Connection configured with Drizzle ORM
- ✅ **Schema Definition**: Complete schema in `shared/schema/`
- ✅ **Migrations**: 7 migration files ready (`migrations/`)
- ⚠️ **Current Active**: MemStorage (in-memory) in production

**Components Ready for Migration:**
- Database connection layer (`server/db.ts`)
- Complete schema with relationships, indexes, RLS policies
- DatabaseStorage class implementing full IStorage interface
- Migration scripts and database structure

### 11.2. Migration Phases

#### **Phase 1: Storage Layer Activation** (Week 1)
**Objective**: Switch from MemStorage to DatabaseStorage in production

**Tasks:**
1. **Update Storage Initialization** (`server/storage.ts`)
   ```typescript
   // Replace current MemStorage initialization
   if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
     console.log('🔗 Initializing PostgreSQL storage for production');
     const { DatabaseStorage } = await import('./dbStorage');
     storage = new DatabaseStorage();
     await storage.initializeData();
   } else {
     console.log('📦 Using in-memory storage for development');
     storage = new MemStorage();
   }
   ```

2. **Environment Configuration**
   - Ensure `DATABASE_URL` is set in production
   - Update deployment scripts to use PostgreSQL
   - Configure connection pooling parameters

3. **Data Initialization**
   - Run `DatabaseStorage.initializeData()` on first deployment
   - Verify sample data creation in production database

#### **Phase 2: Service Migration** (Week 2)
**Objective**: Migrate core business logic to PostgreSQL

**High Priority Services:**
- Work Orders management (routes and services)
- Equipment/Asset tracking
- Parts inventory management
- User profiles and authentication
- Notifications system

**Tasks:**
1. **Route Migration** - Already using storage interface (no changes needed)
2. **Service Updates** - Verify all services work with DatabaseStorage
3. **Integration Testing** - Test all CRUD operations
4. **Performance Validation** - Compare response times

#### **Phase 3: Direct Database Integration** (Week 3)
**Objective**: Optimize services that need direct database access

**Components Using Direct DB Access:**
- `server/services/escalation-engine.ts`
- `server/services/database-optimizer.service.ts`
- `server/services/logging.service.ts`
- `server/middleware/security.middleware.ts`
- `server/routes/labor-time.ts` (hybrid approach)

**Tasks:**
1. **Review Direct DB Usage** - Ensure optimal query patterns
2. **Performance Optimization** - Implement database indexes
3. **Security Validation** - Verify RLS policies and permissions
4. **Monitoring Setup** - Database performance metrics

#### **Phase 4: Testing & Validation** (Week 4)
**Objective**: Comprehensive testing and production readiness

**Tasks:**
1. **Integration Test Updates**
   - Update tests to use DatabaseStorage
   - Verify all API endpoints work correctly
   - Test error handling and edge cases

2. **Performance Testing**
   - Load testing with real database
   - Query optimization and index validation
   - Connection pool tuning

3. **Data Migration Verification**
   - Verify all data types and relationships
   - Test data integrity constraints
   - Validate audit trail functionality

### 11.3. Rollback Strategy
**Immediate Rollback:** Switch storage initialization back to MemStorage
**Data Preservation:** Export critical data before migration
**Monitoring:** Real-time alerts for database connection issues
**Fallback Environment:** Keep previous version deployed for emergency rollback

### 11.4. Risk Mitigation
- **Staging Environment**: Full testing before production deployment
- **Database Backups**: Automated backups before migration
- **Gradual Rollout**: Deploy to staging, then production
- **Monitoring**: Database performance and error rate monitoring
- **Team Training**: Ensure team is familiar with PostgreSQL operations

---

## 12. Traceability Matrix

### 12.1. Storage Components Status

| Component | Type | Current State | Target State | Priority | Status | Owner | Notes |
|-----------|------|---------------|--------------|----------|--------|--------|-------|
| **Core Storage Layer** |
| `server/storage.ts` | Interface | MemStorage Active | DatabaseStorage | Critical | 🔄 Ready | Backend | Switch initialization logic |
| `server/dbStorage.ts` | Implementation | Available | Active | Critical | ✅ Complete | Backend | 760 lines, full IStorage impl |
| `server/db.ts` | Connection | Configured | Active | Critical | ✅ Complete | Backend | Neon connection ready |
| **API Routes** |
| `server/routes.ts` | Routes | MemStorage | DatabaseStorage | High | ✅ Ready | Backend | Uses storage interface |
| `server/routes/api-v2.ts` | Enhanced API | MemStorage | DatabaseStorage | High | ✅ Ready | Backend | Enhanced validation |
| `server/routes/labor-time.ts` | Labor Time | Hybrid | DatabaseStorage | Medium | 🔄 Partial | Backend | Uses both storage & db |
| `server/routes/partsConsumption.ts` | Parts | MemStorage | DatabaseStorage | High | ✅ Ready | Backend | Inventory critical |
| **Business Services** |
| `server/services/notification.service.ts` | Notifications | MemStorage | DatabaseStorage | High | ✅ Ready | Backend | User communications |
| `server/services/pm-scheduler.ts` | PM Scheduling | MemStorage | DatabaseStorage | High | ✅ Ready | Backend | Maintenance planning |
| `server/services/audit-trail.service.ts` | Audit | MemStorage | DatabaseStorage | High | ✅ Ready | Backend | Compliance critical |
| `server/services/webhook.service.ts` | Webhooks | MemStorage | DatabaseStorage | Medium | ✅ Ready | Backend | External integrations |
| `server/services/ai-predictive.service.ts` | AI Features | MemStorage | DatabaseStorage | Low | ✅ Ready | Backend | Advanced features |
| `server/services/file-management.service.ts` | Files | MemStorage | DatabaseStorage | Medium | ✅ Ready | Backend | Document management |
| **Direct Database Services** |
| `server/services/escalation-engine.ts` | Escalation | Direct DB | Optimized | High | ✅ Complete | Backend | Already using PostgreSQL |
| `server/services/database-optimizer.service.ts` | DB Optimization | Direct DB | Active | Critical | ✅ Complete | Backend | Performance management |
| `server/services/enhanced-database-optimizer.service.ts` | Enhanced DB Opt | Direct DB | Active | Medium | ✅ Complete | Backend | Advanced optimization |
| `server/services/advanced-health.service.ts` | Health Check | Direct DB | Active | Medium | ✅ Complete | Backend | System monitoring |
| `server/services/logging.service.ts` | System Logging | Direct DB | Active | High | ✅ Complete | Backend | Audit and compliance |
| **Security & Middleware** |
| `server/middleware/security.middleware.ts` | Security | Direct DB | Active | Critical | ✅ Complete | Backend | Security audit logs |
| **Database Infrastructure** |
| `migrations/` | Schema | Complete | Active | Critical | ✅ Complete | Backend | 7 migration files ready |
| `shared/schema/` | Schema Def | Complete | Active | Critical | ✅ Complete | Backend | Full table definitions |
| **Testing** |
| Integration Tests | Testing | MemStorage | DatabaseStorage | High | 🔄 Pending | QA | Need test updates |
| Unit Tests | Testing | Mocked | Mocked | Low | ✅ Complete | QA | Mock compatibility maintained |
| Performance Tests | Testing | Not configured | Required | Medium | ❌ TODO | QA | Load testing needed |

### 12.2. Migration Checklist

#### **Pre-Migration** ✅ = Complete, 🔄 = In Progress, ❌ = Not Started

| Task | Status | Owner | Due Date | Notes |
|------|--------|--------|----------|-------|
| **Infrastructure** |
| Database connection verification | ✅ | Backend | Complete | Neon PostgreSQL ready |
| Schema migrations available | ✅ | Backend | Complete | 7 migration files |
| DatabaseStorage class complete | ✅ | Backend | Complete | Full IStorage implementation |
| Environment variables configured | 🔄 | DevOps | Week 1 | DATABASE_URL in production |
| **Code Preparation** |
| Storage interface compliance | ✅ | Backend | Complete | All services use interface |
| Direct DB usage documented | ✅ | Backend | Complete | 8 services identified |
| Error handling implemented | ✅ | Backend | Complete | Try/catch patterns |
| **Testing Preparation** |
| Test environment setup | 🔄 | QA | Week 1 | Staging database |
| Integration test updates planned | 🔄 | QA | Week 2 | DatabaseStorage testing |
| Performance test scenarios | ❌ | QA | Week 3 | Load testing plan |
| **Operational Readiness** |
| Backup strategy defined | 🔄 | DevOps | Week 1 | Automated backups |
| Monitoring setup | 🔄 | DevOps | Week 1 | Database metrics |
| Rollback procedure documented | 🔄 | DevOps | Week 1 | Emergency procedures |

#### **Migration Execution**

| Phase | Task | Status | Owner | Target Date | Completion Date |
|-------|------|--------|--------|-------------|-----------------|
| **Phase 1** | Storage Layer Activation |
| | Update storage initialization | ❌ | Backend | Week 1 Day 1 | |
| | Deploy to staging | ❌ | DevOps | Week 1 Day 2 | |
| | Validate staging functionality | ❌ | QA | Week 1 Day 3 | |
| | Deploy to production | ❌ | DevOps | Week 1 Day 5 | |
| **Phase 2** | Service Migration |
| | Core API validation | ❌ | Backend | Week 2 Day 1 | |
| | Integration testing | ❌ | QA | Week 2 Day 2-3 | |
| | Performance validation | ❌ | QA | Week 2 Day 4 | |
| | User acceptance testing | ❌ | QA | Week 2 Day 5 | |
| **Phase 3** | Optimization |
| | Direct DB service review | ❌ | Backend | Week 3 Day 1-2 | |
| | Performance optimization | ❌ | Backend | Week 3 Day 3-4 | |
| | Security validation | ❌ | Security | Week 3 Day 5 | |
| **Phase 4** | Final Validation |
| | Comprehensive testing | ❌ | QA | Week 4 Day 1-3 | |
| | Production monitoring | ❌ | DevOps | Week 4 Day 4 | |
| | Documentation updates | ❌ | Technical Writer | Week 4 Day 5 | |

### 12.3. Success Metrics

| Metric | Current (MemStorage) | Target (PostgreSQL) | Measurement Method |
|--------|---------------------|---------------------|-------------------|
| **Performance** |
| API Response Time | < 200ms | < 300ms | Application monitoring |
| Database Query Time | N/A | < 100ms | Database monitoring |
| Concurrent Users | 50 | 500+ | Load testing |
| **Reliability** |
| Data Persistence | Session-based | Permanent | Data integrity tests |
| System Uptime | 99% | 99.9% | Monitoring alerts |
| Backup Recovery | N/A | < 4 hours | Recovery testing |
| **Features** |
| Advanced Queries | Limited | Full SQL | Feature testing |
| Reporting Capabilities | Basic | Advanced | Business validation |
| Audit Trail | Basic | Complete | Compliance testing |

---

## 13. Next Steps
1. **Week 1**: Execute Phase 1 - Storage Layer Activation
2. **Week 2**: Execute Phase 2 - Service Migration  
3. **Week 3**: Execute Phase 3 - Direct Database Integration
4. **Week 4**: Execute Phase 4 - Testing & Validation
5. **Ongoing**: Monitor performance and optimize queries

---

*This roadmap is a living document. Update the traceability matrix as migration progresses and requirements evolve.*


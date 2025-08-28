# PestShield Pro - Enterprise Pest Control Platform

## Overview

PestShield Pro is a comprehensive, enterprise-grade pest control platform built on top of the MaintAInPro CMMS infrastructure. It provides state-of-the-art management capabilities for pest control businesses with the same level of rigor, quality, and completeness as projects at Google or Microsoft.

## Features

### 🏠 Customer Website & Portal
- **Customer Profiles & Accounts**: Complete customer management with service history
- **Billing Integration**: Support for cards, bank transfers, and autopay
- **AI-Powered Quotes**: Intelligent quote generation with clear assumptions and risk assessment
- **Booking & Rescheduling**: Easy appointment management with real-time availability
- **Notifications**: Multi-channel notifications (email, SMS, push)
- **Warranties & Documents**: Digital document management and warranty tracking
- **Loyalty & Referrals**: Customer loyalty programs with tier-based benefits

### 🤖 AI-Powered Chatbot (Customer)
- **Natural Language Q&A**: Intelligent customer service automation
- **Book/Reschedule/Pay**: Complete transaction capabilities through chat
- **Upselling**: Smart recommendations based on customer history
- **Prep Instructions**: Automated service preparation guidance
- **Guardrails**: Human escalation for complex issues
- **Multi-language Support**: Configurable language preferences

### 👨‍💼 Admin Panel (AI-Assisted)
- **User & Role Management**: RBAC with warehouse isolation
- **Pricing Rules**: Dynamic pricing with AI optimization
- **Inventory & Chemical Tracking**: EPA-compliant chemical management
- **Lot & MSDS Tracking**: Complete regulatory compliance
- **Auto-reorder**: Intelligent inventory replenishment
- **Invoices & Payments**: Comprehensive financial management
- **Dispatch Board**: Visual technician scheduling and routing
- **CRM Automations**: Automated customer relationship workflows
- **Analytics Dashboards**: Real-time business intelligence
- **Regulatory Reporting**: EPA and state compliance reporting

### 📱 Technician Dashboard/App (AI-Assisted)
- **Smart Routing**: AI-powered route optimization
- **Turn-by-turn Navigation**: Integrated GPS navigation
- **PPE Reminders**: Safety equipment compliance tracking
- **Chemical Logging**: Barcode/QR scanning with geo-timestamps
- **EPA Compliance**: Complete application logging and weather tracking
- **Notes & Photos**: Digital service documentation
- **AI Summaries**: Automated service report generation
- **On-site Quotes & Payments**: Mobile transaction processing
- **Timekeeping**: Integrated time tracking and productivity metrics

### 🧠 AI-Powered CRM
- **Automated Scheduling**: Intelligent appointment optimization
- **Lead Scoring**: AI-driven customer prioritization
- **Churn Prediction**: Proactive customer retention
- **Conversation Intelligence**: Automated call analysis
- **Business Insights**: Natural language explanations of data
- **Campaign Orchestration**: Multi-channel marketing automation
- **Next-best-action Recommendations**: Contextual guidance for staff

### 🔌 APIs & Events
- **RESTful APIs**: Complete CRUD operations for all entities
- **CloudEvents Integration**: Event-driven architecture
- **Event Types**: 
  - `customer.created`
  - `quote.accepted`
  - `workorder.started`
  - `inventory.consumed`
  - `payment.processed`
- **Webhook Support**: External system integration
- **Real-time Updates**: WebSocket-powered live data

## Core Workflows

The platform supports the complete pest control business lifecycle:

**Quote → Book → Dispatch → Service → Invoice → Collect → Report**

Each step includes:
- AI explanations for decisions made
- Compliance logging for regulatory requirements
- Audit trails for complete traceability
- Quality assurance checkpoints

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: PostgreSQL with strategic indexing
- **Feature Flags**: Controlled rollout system
- **Multi-tenant**: Organization-based isolation
- **Authentication**: JWT with RBAC
- **Testing**: Comprehensive test pyramid (unit, integration, e2e)

### Security & Compliance
- **RBAC**: Role-based access control with audit trails
- **Encryption**: Data encrypted at rest and in transit
- **EPA Compliance**: Chemical usage tracking and reporting
- **Payment Standards**: PCI-compliant payment processing
- **Accessibility**: WCAG AA compliance
- **Incident Management**: Automated response and rollback
- **SLOs**: Service level objectives with monitoring

### AI Guardrails
- AI assistants propose actions but require explicit human confirmation before state changes
- Risk assessment for all automated decisions
- Human escalation paths for complex scenarios
- Compliance validation for all AI-generated content

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Coding-Krakken/MaintAInPro.git
   cd MaintAInPro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and API keys
   ```

4. **Run database migrations**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Feature Flag Configuration

Enable pest control features in `config/feature-flags.ts`:

```typescript
pestControlPlatform: {
  enabled: true,
  rolloutPercentage: 100,
  environments: ['development', 'staging', 'production'],
}
```

### Database Schema

The pest control platform extends the existing CMMS schema with:

- **customers**: Customer profiles and account information
- **properties**: Service locations with pest history
- **services**: Available pest control services
- **chemicals**: EPA-compliant chemical inventory
- **service_appointments**: Scheduled pest control services
- **quotes**: AI-generated customer quotes
- **routes**: Technician routing and territory management

## API Documentation

### Customer Management
```typescript
// Create customer
POST /api/pest-control/customers
{
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  companyName?: string
}

// Get customers
GET /api/pest-control/customers
```

### Service Appointments
```typescript
// Create appointment
POST /api/pest-control/appointments
{
  customerId: string,
  propertyId: string,
  serviceId: string,
  scheduledDate: string,
  timeWindow: string
}
```

### Chemical Tracking (EPA Compliant)
```typescript
// Add chemical
POST /api/pest-control/chemicals
{
  productName: string,
  activeIngredient: string,
  epaRegistrationNumber: string,
  currentStock: number
}
```

## Testing

```bash
# Run all tests
npm run test:all

# Run integration tests
npm run test:integration

# Run pest control specific tests
npm run test:integration -- pest-control-platform

# Run with coverage
npm run test:coverage
```

## Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy to Railway
npm run deploy:railway
```

### Environment Configuration
- **Development**: Full feature access with mock integrations
- **Staging**: Production-like environment for testing
- **Production**: Full compliance and monitoring enabled

## Monitoring & Observability

- **Health Endpoints**: `/api/health` for system monitoring
- **Metrics**: Business KPIs and system performance
- **Logging**: Structured logging with correlation IDs
- **Alerting**: Automated incident response
- **Tracing**: Request tracing across services

## Compliance & Regulatory

### EPA Requirements
- Complete chemical application logging
- Weather condition tracking
- Applicator license validation
- Equipment calibration records
- Safety data sheet management

### Business Compliance
- Payment processing (PCI)
- Data privacy (GDPR/CCPA)
- Accessibility standards (WCAG AA)
- Industry regulations (state pesticide laws)

## Support

- **Documentation**: Comprehensive guides in `/Documentation`
- **API Reference**: Interactive docs at `/api/api-docs`
- **Issue Tracking**: GitHub issues for bug reports
- **Community**: Wiki-based knowledge sharing

## Roadmap

- [x] Core platform with CRUD operations
- [x] Customer portal and technician app
- [x] Chemical tracking and EPA compliance
- [ ] AI chatbot integration
- [ ] Route optimization algorithms
- [ ] Advanced CRM features
- [ ] Payment processing integration
- [ ] Mobile app native versions

## Contributing

See [CONTRIBUTING.md](Documentation/CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**PestShield Pro**: Enterprise-grade pest control management for the modern business.
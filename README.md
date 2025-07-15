# MaintAInPro CMMS

A comprehensive Computerized Maintenance Management System (CMMS) built with modern web technologies.

## 🚀 **Quick Start**

1. **Setup**: Follow the [Setup Guide](Documentation/SETUP.md) for complete installation instructions
2. **Credentials**: Check [CREDENTIALS.md](CREDENTIALS.md) for test account credentials
3. **Documentation**: Browse the [Documentation](Documentation/) folder for detailed guides

## 📋 **Features**

- **Work Order Management** - Create, assign, and track maintenance work orders
- **Equipment Asset Management** - Comprehensive equipment tracking and maintenance history
- **Parts & Inventory** - Inventory management with automated reordering
- **Preventive Maintenance** - Scheduled maintenance with automated reminders
- **Vendor Management** - Contractor and vendor relationship management
- **Reporting & Analytics** - Real-time dashboards and comprehensive reporting
- **User Role Management** - Granular permissions and multi-tenant support

## 🛠️ **Technology Stack**

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router
- **Testing**: Vitest, Playwright
- **Deployment**: Netlify

## 📚 **Documentation**

Complete documentation is available in the [Documentation](Documentation/) folder:

- [Setup Guide](Documentation/SETUP.md) - Complete setup instructions
- [Technical Stack](Documentation/TechnicalStack.md) - Detailed technical overview
- [API Specification](Documentation/APISpecification.md) - API endpoints and usage
- [User Roles & Permissions](Documentation/UserRolesPermissions.md) - User management system
- [Module Documentation](Documentation/) - Detailed module guides

## 🔐 **Test Credentials**

See [CREDENTIALS.md](CREDENTIALS.md) for complete list of test accounts with different roles and permissions.

## 🏗️ **Project Structure**

```
src/
├── components/          # Reusable UI components
├── modules/            # Feature-specific modules
│   ├── auth/          # Authentication
│   ├── equipment/     # Equipment management
│   ├── inventory/     # Parts & inventory
│   ├── work-orders/   # Work order management
│   └── ...
├── pages/             # Main application pages
├── services/          # API services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🚀 **Development**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## 📝 **License**

This project is for demonstration purposes.

---

**Last Updated:** July 15, 2025

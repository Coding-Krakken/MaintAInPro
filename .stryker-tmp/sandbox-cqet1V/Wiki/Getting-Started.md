# 🚀 Getting Started with MaintAInPro

Welcome to MaintAInPro! This guide will help you get up and running quickly, whether you're a user, developer, or system administrator.

## 🎯 Choose Your Path

### 👤 I'm a User
**Goal**: Learn how to use the CMMS system for maintenance management

**Next Steps**:
1. Read the **[[User Guide]]** for complete system usage
2. Check **[[Work Orders]]** to learn about managing maintenance tasks
3. Explore **[[Equipment Management]]** for asset tracking
4. Review **[[Parts Inventory]]** for inventory management

### 💻 I'm a Developer
**Goal**: Set up development environment and contribute to the project

**Next Steps**:
1. Follow the **[[Developer Guide]]** for complete setup
2. Review the **[[Architecture]]** documentation
3. Check the **[[API Reference]]** for endpoint details
4. Read **[[Testing Guide]]** for quality standards

### 🔧 I'm a System Administrator
**Goal**: Deploy and manage MaintAInPro in production

**Next Steps**:
1. Review **[[System Requirements]]** first
2. Follow the **[[Deployment Guide]]** for production setup
3. Check **[[Security Guide]]** for hardening
4. Read **[[Operations Guide]]** for monitoring

## ⚡ Quick Start (5 Minutes)

### Option 1: Try the Demo
Visit our [live demo](https://maintainpro.vercel.app) to explore MaintAInPro without installation.

**Demo Credentials**:
- **Email**: demo@maintainpro.com
- **Password**: demo123

### Option 2: Local Development Setup

#### Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher  
- **npm**: v8 or higher

#### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Coding-Krakken/MaintAInPro.git
cd MaintAInPro

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# 4. Set up the database
npm run db:push
npm run seed

# 5. Start development server
npm run dev
```

🎉 **Success!** Visit http://localhost:5173 to see MaintAInPro running locally.

### Option 3: Docker Quick Start

```bash
# 1. Clone and navigate
git clone https://github.com/Coding-Krakken/MaintAInPro.git
cd MaintAInPro

# 2. Start with Docker Compose
docker-compose up --build

# 3. Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

## 📋 System Requirements

### Minimum Requirements
- **OS**: Linux, macOS, or Windows
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB available space
- **Network**: Internet connection for package installation

### Development Requirements
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: Latest version

### Production Requirements
- **CPU**: 2 cores minimum, 4+ recommended
- **RAM**: 8GB minimum, 16GB+ recommended
- **Storage**: 50GB+ with SSD recommended
- **Database**: PostgreSQL 14+ with connection pooling
- **Load Balancer**: Nginx or similar (for high availability)

## 🔐 Initial Configuration

### Environment Variables

Create `.env.local` file with these essential variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/maintainpro"

# Application Configuration
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:5173"

# Session Configuration
SESSION_SECRET="your-super-secret-session-key"

# Optional: File Upload Configuration
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760  # 10MB

# Optional: Email Configuration (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Database Setup

```bash
# Generate and run migrations
npm run db:generate
npm run db:push

# Seed with sample data (optional)
npm run seed
```

### First User Setup

1. Start the application: `npm run dev`
2. Visit http://localhost:5173
3. Click "Register" to create your first user account
4. The first registered user automatically gets admin privileges

## 🧪 Verify Installation

### Run Quality Checks

```bash
# Run all quality checks
npm run quality

# Individual checks
npm run lint:check        # Code linting
npm run format:check      # Code formatting
npm run type-check        # TypeScript validation
npm run test:run          # Run all tests
```

### Test Core Features

1. **Authentication**: Register and login
2. **Work Orders**: Create a test work order
3. **Equipment**: Add a piece of equipment
4. **Parts**: Add inventory items
5. **Dashboard**: View analytics and metrics

## 🎯 Next Steps

### For Users
1. **Learn the Basics**: Read the complete **[[User Guide]]**
2. **Explore Modules**:
   - **[[Work Orders]]** - Managing maintenance tasks
   - **[[Equipment Management]]** - Asset tracking
   - **[[Parts Inventory]]** - Stock management
3. **Mobile Usage**: Learn about the PWA mobile interface
4. **Tips & Tricks**: Check **[[Troubleshooting]]** for helpful tips

### For Developers
1. **Understand Architecture**: Review **[[Architecture]]** documentation
2. **API Integration**: Explore the **[[API Reference]]**
3. **Contributing**: Read the **[[Developer Guide]]**
4. **Testing**: Review **[[Testing Guide]]** for quality standards
5. **Deployment**: Learn **[[Deployment Guide]]** for production

### For Administrators
1. **Security Setup**: Follow the **[[Security Guide]]**
2. **Performance Tuning**: Review **[[Performance Guide]]**
3. **Monitoring**: Set up **[[Operations Guide]]** procedures
4. **Backup Strategy**: Plan data protection and recovery
5. **User Management**: Configure roles and permissions

## 🆘 Troubleshooting Common Issues

### Installation Issues

**Node.js Version Error**
```bash
# Check your Node.js version
node --version

# Use nvm to install correct version
nvm install 18
nvm use 18
```

**Database Connection Error**
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U username -d maintainpro
```

**Port Already in Use**
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env.local
PORT=5001
```

### Common Solutions

| Issue | Solution |
|-------|----------|
| **Build Fails** | Run `npm install` and check Node.js version |
| **Database Error** | Verify `DATABASE_URL` in `.env.local` |
| **Permission Denied** | Check file permissions: `chmod +x scripts/*` |
| **Tests Failing** | Run `npm run test:run` to see specific failures |
| **Port Conflicts** | Change `PORT` in `.env.local` |

For more detailed troubleshooting, see **[[Troubleshooting]]**.

## 📞 Getting Help

### Documentation
- **[[User Guide]]** - Complete user manual
- **[[API Reference]]** - Technical API documentation  
- **[[Troubleshooting]]** - Common issues and solutions

### Community Support
- **[GitHub Issues](https://github.com/Coding-Krakken/MaintAInPro/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/Coding-Krakken/MaintAInPro/discussions)** - Questions and community help
- **[Contributing Guide](Developer-Guide)** - How to contribute to the project

### Professional Support
For enterprise deployments and professional support:
- Email: support@maintainpro.com
- Documentation: **[[Operations Guide]]**
- Security: **[[Security Guide]]**

---

## 🎉 Welcome to MaintAInPro!

You're now ready to start using MaintAInPro. Whether you're managing maintenance operations, developing new features, or deploying in production, our comprehensive documentation will guide you every step of the way.

**Happy maintaining! 🔧**

---

*Getting Started guide last updated: January 2025*
# Scripts Directory

This directory contains all project scripts organized into functional
subdirectories.

## Directory Structure

### 📁 `build/`

Build configuration and tooling scripts

- `eslintrc.js` - ESLint configuration
- `jest.accessibility.config.js` - Jest accessibility testing configuration
- `postcss.config.js` - PostCSS configuration

### 📁 `database/`

Database management and migration scripts

- `run-migrations.cjs` - Database migration runner
- `seed.ts` - Database seeding script

### 📁 `deployment/`

Production deployment and infrastructure scripts

- `deploy.sh` - Main deployment script
- `production-deploy.sh` - Production-specific deployment
- `production-start.sh` - Production startup script

### 📁 `development/`

Development utilities and organization scripts

- `cleanup_script.sh` - Code cleanup and maintenance
- `run.sh` - Development runner script

### 📁 `migration/`

Database and system migration scripts

- `migration-final-report.sh` - Final migration report generator
- `migration-phase1-setup.sh` - Phase 1 migration setup
- `migration-status.sh` - Migration status checker

### 📁 `testing/`

Testing, validation, and quality assurance scripts

- `migration-test-suite.mjs` - Migration testing suite
- `phase2-api-test.js` - Phase 2 API testing
- `test-db.mjs` - Database testing utilities
- `test-migration-api.sh` - API migration tests
- `test-migration-phase1.sh` - Phase 1 migration tests
- `test-storage.mjs` - Storage system tests
- `validate-migration.js` - Migration validation script

## Usage Guidelines

1. **Make scripts executable**: `chmod +x script-name.sh`
2. **Run from project root**: Most scripts expect to be run from
   `/workspaces/MaintAInPro/`
3. **Check dependencies**: Ensure required tools and packages are installed
4. **Review configurations**: Check build configs before running deployment
   scripts

## Script Categories

- **Shell Scripts (`.sh`)**: System operations, deployment, setup
- **JavaScript (`.js`, `.mjs`, `.cjs`)**: Node.js utilities, testing, validation
- **TypeScript (`.ts`)**: Type-safe database operations and utilities
- **Configuration Files**: Build tools, linting, testing setup

## Development Workflow

1. Use `development/` scripts for local development
2. Run `testing/` scripts before committing changes
3. Use `migration/` scripts for database changes
4. Use `deployment/` scripts for production releases
5. Modify `build/` configs for tooling adjustments

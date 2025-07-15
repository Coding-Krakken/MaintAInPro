# MaintAInPro CMMS - Development Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/Coding-Krakken/MaintAInPro.git
cd MaintAInPro

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Test Credentials

- **Email**: admin@demo.com
- **Password**: admin123

## 📋 Available Scripts

### Development

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build           # Build for production
npm run preview         # Preview production build
```

### Testing

```bash
npm run test            # Run unit tests
npm run test:coverage   # Run tests with coverage report
npm run test:e2e        # Run end-to-end tests
npm run test:ui         # Run tests with interactive UI
```

### Code Quality

```bash
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking
```

## 🏗️ Project Structure

```
MaintAInPro/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base components (Button, Input, Modal)
│   │   └── layout/         # Layout components (Header, Sidebar)
│   ├── modules/            # Feature modules
│   │   └── auth/           # Authentication module
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # External library configurations
│   ├── services/           # API services
│   ├── test/               # Test utilities and setup
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── tests/
│   └── e2e/                # End-to-end tests
├── Documentation/          # Project documentation
├── supabase/              # Database migrations and schema
└── public/                # Static assets
```

## 🧪 Testing

### Unit Tests

- **Framework**: Vitest with React Testing Library
- **Coverage**: 85% minimum threshold
- **Location**: `src/**/*.test.{ts,tsx}`

### E2E Tests

- **Framework**: Playwright
- **Browsers**: Chrome, Firefox, Safari + Mobile
- **Location**: `tests/e2e/*.spec.ts`

### Running Tests

```bash
# Unit tests
npm run test                # Run all unit tests
npm run test:coverage       # With coverage report
npm run test:watch          # Watch mode

# E2E tests
npm run test:e2e            # All browsers
npm run test:e2e:chrome     # Chrome only
npm run test:e2e:mobile     # Mobile devices
```

## 🎨 UI Components

### Base Components

- **Button**: Multiple variants with loading states
- **Input**: Form inputs with validation
- **Modal**: Accessible dialogs
- **LoadingSpinner**: Consistent loading indicators

### Usage Example

```tsx
import { Button } from '@/components/ui/Button';

function MyComponent() {
  return (
    <Button variant='primary' size='lg' onClick={handleClick}>
      Click me
    </Button>
  );
}
```

## 🔐 Authentication

### How It Works

1. **Supabase Auth**: JWT-based authentication
2. **Protected Routes**: Route-level protection
3. **Session Management**: Automatic token refresh
4. **Error Handling**: Comprehensive error states

### Auth Hook Usage

```tsx
import { useAuth } from '@/modules/auth/hooks/useAuth';

function MyComponent() {
  const { user, isLoading, isAuthenticated, signIn, signOut } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  return isAuthenticated ? <Dashboard /> : <LoginForm />;
}
```

## 💾 Database

### Schema

- **Users**: User profiles and permissions
- **Organizations**: Multi-tenant organization data
- **Equipment**: Asset and equipment management
- **Work Orders**: Maintenance work orders
- **Inventory**: Parts and inventory tracking

### Database Service

```tsx
import { userService } from '@/lib/database';

// Get user profile
const user = await userService.getProfile(userId);

// Update user profile
await userService.updateProfile(userId, { firstName: 'John' });
```

## 🔄 State Management

### Auth State

- **Provider**: AuthProvider wraps the app
- **Hook**: useAuth() for auth operations
- **Persistence**: Automatic session persistence

### Server State

- **React Query**: For server state management
- **Caching**: Intelligent caching and invalidation
- **Offline**: Offline-first approach

## 🎯 Code Standards

### TypeScript

- **Strict Mode**: Enabled for type safety
- **Interfaces**: Prefer interfaces over types
- **Generics**: Use for reusable components

### React

- **Hooks**: Prefer hooks over class components
- **Components**: Functional components with TypeScript
- **Props**: Explicit prop types with interfaces

### Styling

- **Tailwind CSS**: Utility-first approach
- **Components**: Consistent component API
- **Responsive**: Mobile-first design

## 🐛 Debugging

### Development Tools

- **React DevTools**: Component inspection
- **Browser DevTools**: Network and console debugging
- **VS Code**: Integrated debugging support

### Common Issues

1. **Loading Forever**: Check auth hook implementation
2. **Database Errors**: Verify field name mapping
3. **Type Errors**: Check TypeScript configurations
4. **Test Failures**: Verify test setup and mocks

## 📝 Contributing

### Development Workflow

1. **Branch**: Create feature branch from main
2. **Code**: Implement feature with tests
3. **Test**: Run all tests and ensure coverage
4. **Commit**: Use conventional commit format
5. **PR**: Create pull request with description

### Commit Format

```
feat(auth): add password reset functionality
fix(ui): resolve button loading state issue
docs(readme): update setup instructions
test(auth): add unit tests for login flow
```

### Code Review Checklist

- [ ] Tests written and passing
- [ ] TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Documentation updated
- [ ] Responsive design verified

## 🔧 Environment Variables

### Required Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Application Configuration
VITE_APP_NAME=MaintAInPro
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

### Optional Variables

```env
# Analytics and Monitoring
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GOOGLE_ANALYTICS_ID=your_ga_id

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_NOTIFICATIONS=true
```

## 📚 Resources

### Documentation

- [Phase 1 Implementation Summary](Documentation/Phase1-Implementation-Summary.md)
- [Development Roadmap](ROADMAP.md)
- [API Specification](Documentation/Development/APISpecification.md)

### External Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

## 🆘 Support

### Getting Help

1. **Documentation**: Check project documentation first
2. **Issues**: Create GitHub issue with detailed description
3. **Discussions**: Use GitHub discussions for questions
4. **Code Review**: Request code review for complex changes

### Common Solutions

- **Build Issues**: Clear node_modules and reinstall
- **Type Errors**: Check TypeScript configuration
- **Test Failures**: Verify test setup and environment
- **Database Issues**: Check environment variables and schema

---

**Happy coding! 🚀**

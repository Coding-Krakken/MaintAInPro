# 🛠️ Troubleshooting

Common issues, solutions, and debugging techniques for MaintAInPro CMMS.

## 📋 Table of Contents

- [**Quick Diagnosis**](#-quick-diagnosis)
- [**Installation Issues**](#-installation-issues)
- [**Database Problems**](#-database-problems)
- [**Authentication Issues**](#-authentication-issues)
- [**Performance Problems**](#-performance-problems)
- [**API Issues**](#-api-issues)
- [**Frontend Issues**](#-frontend-issues)
- [**File Upload Problems**](#-file-upload-problems)
- [**Mobile/PWA Issues**](#-mobilepwa-issues)
- [**Production Issues**](#-production-issues)
- [**Debugging Tools**](#-debugging-tools)

## 🔍 Quick Diagnosis

### Health Check Commands

```bash
# Check application health
curl http://localhost:5000/api/health

# Check database connectivity
npm run db:studio

# Verify environment variables
npm run check

# Run all quality checks
npm run quality
```

### Common Status Indicators

| Symptom               | Likely Cause                    | Quick Fix                       |
| --------------------- | ------------------------------- | ------------------------------- |
| 🔴 Server won't start | Port in use, missing env vars   | Check port, verify `.env`       |
| 🟡 Slow responses     | Database queries, memory leak   | Check logs, restart app         |
| 🟠 Build fails        | Dependencies, TypeScript errors | `npm install`, fix TS errors    |
| ⚫ Database errors    | Connection, permissions, schema | Check DB status, run migrations |
| 🟣 Auth failures      | JWT secret, token expiry        | Verify secrets, check tokens    |

## 🚀 Installation Issues

### Node.js Version Problems

**Error**: `node: command not found` or version mismatch

**Solution**:

```bash
# Check Node.js version
node --version

# Install correct version with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be v8.x.x or higher
```

### Package Installation Failures

**Error**: `npm install` fails with permission errors

**Solution**:

```bash
# Fix npm permissions (Linux/macOS)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Alternative: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Clear npm cache if needed
npm cache clean --force
```

**Error**: `ENOENT: no such file or directory, scandir`

**Solution**:

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If using Windows, try:
npm install --no-optional
```

### TypeScript Compilation Errors

**Error**: `Cannot find module` or type errors

**Solution**:

```bash
# Install TypeScript globally
npm install -g typescript

# Check TypeScript configuration
npx tsc --noEmit

# Generate types for database schema
npm run db:generate

# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf dist
```

### Environment Variable Issues

**Error**: `Environment variable not found`

**Solution**:

```bash
# Create environment file
cp .env.example .env.local

# Edit with your values
nano .env.local

# Verify variables are loaded
node -e "require('dotenv').config({path: '.env.local'}); console.log(process.env.DATABASE_URL)"
```

**Required Environment Variables**:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/maintainpro"
SESSION_SECRET="your-session-secret"
JWT_SECRET="your-jwt-secret"
NODE_ENV="development"
```

## 🗄️ Database Problems

### Connection Issues

**Error**: `Error: connect ECONNREFUSED`

**Diagnosis**:

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection manually
psql $DATABASE_URL

# Check port availability
netstat -tulpn | grep :5432
```

**Solutions**:

```bash
# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Start PostgreSQL (Windows)
net start postgresql

# Check PostgreSQL configuration
sudo nano /etc/postgresql/15/main/postgresql.conf
# Ensure: listen_addresses = 'localhost' or '*'
```

### Migration Failures

**Error**: `Migration failed` or schema mismatch

**Solution**:

```bash
# Check current database schema
npm run db:studio

# Reset database (CAUTION: loses data)
npm run db:push --force

# Generate new migration
npm run db:generate

# Apply specific migration
npm run db:migrate

# Seed with sample data
npm run seed
```

### Permission Errors

**Error**: `permission denied for relation`

**Solution**:

```sql
-- Connect as superuser
sudo -u postgres psql

-- Grant permissions to application user
GRANT ALL PRIVILEGES ON DATABASE maintainpro TO your_user;
GRANT ALL ON SCHEMA public TO your_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO your_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO your_user;
```

### Performance Issues

**Error**: Slow database queries

**Diagnosis**:

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename = 'work_orders';
```

**Solutions**:

```sql
-- Add missing indexes
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_org_status ON work_orders(organization_id, status);

-- Update table statistics
ANALYZE work_orders;
ANALYZE equipment;
ANALYZE parts;

-- Vacuum tables
VACUUM ANALYZE work_orders;
```

## 🔐 Authentication Issues

### JWT Token Problems

**Error**: `JsonWebTokenError: invalid token`

**Diagnosis**:

```bash
# Decode JWT token (without verification)
node -e "
const jwt = require('jsonwebtoken');
const token = 'your-token-here';
console.log(jwt.decode(token, {complete: true}));
"
```

**Solutions**:

```bash
# Verify JWT secret is correct
echo $JWT_SECRET

# Generate new secret if needed
openssl rand -base64 64

# Check token expiry
node -e "
const jwt = require('jsonwebtoken');
const token = 'your-token-here';
const decoded = jwt.decode(token);
console.log('Expires:', new Date(decoded.exp * 1000));
console.log('Now:', new Date());
"
```

### Session Issues

**Error**: Session not persisting or login loops

**Solution**:

```bash
# Check session configuration
echo $SESSION_SECRET

# Verify session store (if using Redis)
redis-cli ping

# Clear session storage
redis-cli flushdb

# Check cookie settings in browser dev tools
# Look for SameSite, Secure, Domain settings
```

### Password Reset Problems

**Error**: Reset emails not sending or links invalid

**Solution**:

```bash
# Check email configuration
echo $SMTP_HOST
echo $SMTP_USER

# Test email sending
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

### CORS Issues

**Error**: `Access-Control-Allow-Origin` errors

**Solution**:

```typescript
// server/index.ts
import cors from 'cors';

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// For development, temporarily allow all origins:
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
```

## ⚡ Performance Problems

### Slow Page Loading

**Diagnosis**:

```bash
# Check bundle sizes
npm run build
ls -la dist/assets/

# Analyze bundle composition
npx webpack-bundle-analyzer dist/assets/
```

**Solutions**:

```typescript
// Implement code splitting
const WorkOrdersPage = lazy(() => import('./pages/WorkOrdersPage'));
const EquipmentPage = lazy(() => import('./pages/EquipmentPage'));

// Optimize images
// Use WebP format, compress images, implement lazy loading

// Implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';
```

### Memory Leaks

**Diagnosis**:

```bash
# Monitor memory usage
node --inspect server/index.js
# Open chrome://inspect in Chrome

# Check for memory leaks in production
pm2 monit

# Node.js memory usage
node -e "console.log(process.memoryUsage())"
```

**Solutions**:

```typescript
// Fix common memory leaks

// 1. Cleanup intervals and timeouts
useEffect(() => {
  const interval = setInterval(() => {
    // Do something
  }, 1000);

  return () => clearInterval(interval); // Cleanup
}, []);

// 2. Remove event listeners
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// 3. Cancel pending requests
useEffect(() => {
  const abortController = new AbortController();

  fetch('/api/data', { signal: abortController.signal })
    .then(response => response.json())
    .then(data => setData(data));

  return () => abortController.abort();
}, []);
```

### High CPU Usage

**Diagnosis**:

```bash
# Check process CPU usage
top -p $(pgrep node)

# Profile Node.js application
node --prof server/index.js
# Generate profile report
node --prof-process isolate-*.log > profile.txt
```

**Solutions**:

```typescript
// Optimize expensive operations

// 1. Use memoization
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransformation(item));
  }, [data]);

  return <div>{/* Render */}</div>;
});

// 2. Debounce user input
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// 3. Optimize database queries
const getWorkOrdersOptimized = async () => {
  return db
    .select({
      id: workOrders.id,
      title: workOrders.title,
      status: workOrders.status,
      // Only select needed fields
    })
    .from(workOrders)
    .where(eq(workOrders.organizationId, orgId))
    .limit(50); // Always limit results
};
```

## 🔗 API Issues

### 404 Not Found Errors

**Error**: API endpoints returning 404

**Diagnosis**:

```bash
# Check route registration
curl -v http://localhost:5000/api/health

# Check server logs
npm run dev
# Look for route registration messages
```

**Solutions**:

```typescript
// Ensure routes are properly registered
// server/index.ts
import authRoutes from './routes/auth';
import workOrderRoutes from './routes/workOrders';

app.use('/api/auth', authRoutes);
app.use('/api/work-orders', workOrderRoutes);

// Add catch-all for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `API endpoint not found: ${req.method} ${req.path}`,
    },
  });
});
```

### 500 Internal Server Error

**Diagnosis**:

```bash
# Check server logs
tail -f logs/error.log

# Enable debug logging
DEBUG=* npm run dev

# Check database connectivity
npm run db:studio
```

**Solutions**:

```typescript
// Add proper error handling
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack,
      }),
    },
  });
});

// Wrap async route handlers
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

app.get(
  '/api/work-orders',
  asyncHandler(async (req, res) => {
    const workOrders = await workOrderService.getAll();
    res.json({ success: true, data: workOrders });
  })
);
```

### Rate Limiting Issues

**Error**: `Too Many Requests` (429)

**Solution**:

```typescript
// Adjust rate limits for development
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
});

// Skip rate limiting for health checks
app.use('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use('/api/', limiter);
```

## 🎨 Frontend Issues

### Build Failures

**Error**: TypeScript compilation errors

**Solution**:

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update TypeScript
npm update typescript

# Fix common type errors
npm install @types/node @types/react @types/react-dom --save-dev

# Check for conflicting dependencies
npm ls
```

### React Hydration Errors

**Error**: Hydration mismatch or `Warning: Text content did not match`

**Solution**:

```typescript
// Fix date/time rendering differences
const formatDate = (date: Date) => {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return date.toISOString().split('T')[0];
  }
  // Client-side rendering
  return date.toLocaleDateString();
};

// Use useEffect for client-only code
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return null; // or skeleton
}

return <div>{clientOnlyContent}</div>;
```

### Component State Issues

**Error**: State not updating or infinite re-renders

**Solution**:

```typescript
// Fix dependency arrays
useEffect(() => {
  fetchData();
}, []); // Empty dependency array for mount-only

// Memoize objects/functions passed as dependencies
const memoizedConfig = useMemo(
  () => ({
    apiKey: 'key',
    endpoint: '/api/data',
  }),
  []
);

useEffect(() => {
  fetchWithConfig(memoizedConfig);
}, [memoizedConfig]);

// Use functional updates for state
setCount(prevCount => prevCount + 1);
```

### Route Issues

**Error**: Routes not working or 404 on refresh

**Solution**:

```typescript
// Ensure browser router is configured correctly
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetails />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// For deployment, ensure server handles SPA routing
// nginx.conf
try_files $uri $uri/ /index.html;
```

## 📁 File Upload Problems

### Upload Failures

**Error**: Files not uploading or timeout errors

**Diagnosis**:

```bash
# Check upload directory permissions
ls -la uploads/
chmod 755 uploads/

# Check disk space
df -h

# Test upload manually
curl -X POST -F "file=@test.jpg" http://localhost:5000/api/upload
```

**Solutions**:

```typescript
// Increase upload limits
import multer from 'multer';

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  },
});

// Handle upload errors
app.post('/api/upload', upload.single('file'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No file uploaded' },
    });
  }

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: { message: 'File too large' },
      });
    }
  }
  next(error);
});
```

### File Permissions

**Error**: Cannot read/write files

**Solution**:

```bash
# Fix directory permissions
sudo chown -R $USER:$USER uploads/
chmod -R 755 uploads/

# For production, use specific user
sudo chown -R www-data:www-data uploads/
chmod -R 644 uploads/
```

## 📱 Mobile/PWA Issues

### Service Worker Problems

**Error**: PWA not working offline or updates not loading

**Solution**:

```typescript
// Register service worker correctly
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Force service worker update
navigator.serviceWorker.getRegistrations().then(registrations => {
  for (let registration of registrations) {
    registration.unregister();
  }
});
```

### Push Notifications

**Error**: Notifications not working

**Solution**:

```typescript
// Request notification permission
const requestPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Check notification support
if (!('Notification' in window)) {
  console.log('This browser does not support notifications');
} else if (Notification.permission === 'denied') {
  console.log('Notifications are blocked');
}
```

### iOS Safari Issues

**Error**: PWA not installing on iOS

**Solution**:

```html
<!-- Add proper meta tags -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="MaintAInPro" />
<link rel="apple-touch-icon" href="/icon-192x192.png" />

<!-- Manifest must be served with correct MIME type -->
<link rel="manifest" href="/manifest.json" />
```

## 🚀 Production Issues

### Deployment Failures

**Error**: Vercel deployment failing

**Diagnosis**:

```bash
# Check build locally
npm run build

# Check Vercel logs
vercel logs

# Verify environment variables
vercel env ls
```

**Solutions**:

```bash
# Fix build issues
npm run clean
npm install
npm run build

# Check vercel.json configuration
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ]
}

# Set correct environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
```

### SSL Certificate Issues

**Error**: SSL certificate invalid or expired

**Solution**:

```bash
# Check certificate status
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Renew Let's Encrypt certificate
sudo certbot renew

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout | grep "Not After"
```

### Load Balancer Issues

**Error**: High response times or timeouts

**Solution**:

```bash
# Check application health
curl -f http://localhost:5000/api/health || exit 1

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://your-domain.com/api/health

# Scale application instances
pm2 scale app +2
pm2 status
```

## 🔧 Debugging Tools

### Logging

```typescript
// Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Usage
logger.info('Work order created', { workOrderId: '123', userId: 'user1' });
logger.error('Database connection failed', { error: error.message });
```

### Performance Monitoring

```typescript
// Add request timing
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// Memory usage monitoring
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
  });
}, 30000); // Every 30 seconds
```

### Browser DevTools

```typescript
// Add debugging helpers to window (development only)
if (process.env.NODE_ENV === 'development') {
  (window as any).debug = {
    user: () => store.getState().user,
    workOrders: () => store.getState().workOrders,
    clearCache: () => queryClient.clear(),
    logs: () =>
      console.log(
        'Available debug commands:',
        Object.keys((window as any).debug)
      ),
  };
}
```

### Database Debugging

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 0;
SELECT pg_reload_conf();

-- Check current connections
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity
WHERE state != 'idle';

-- Check locks
SELECT
    blocked_locks.pid AS blocked_pid,
    blocking_locks.pid AS blocking_pid,
    blocked_activity.usename AS blocked_user,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## 📞 Getting Additional Help

### Documentation Resources

- **[[Getting Started]]** - Initial setup and configuration
- **[[Developer Guide]]** - Development environment setup
- **[[API Reference]]** - API endpoint documentation
- **[[Deployment Guide]]** - Production deployment issues

### Community Support

- **[GitHub Issues](https://github.com/Coding-Krakken/MaintAInPro/issues)** -
  Report bugs and request features
- **[GitHub Discussions](https://github.com/Coding-Krakken/MaintAInPro/discussions)** -
  Ask questions and get help

### Professional Support

- **Email**: support@maintainpro.com
- **Priority Support**: Available for enterprise customers
- **Response Time**: 24-48 hours for technical issues

### Creating Support Requests

When creating a support request, include:

1. **Environment Information**:

   ```bash
   node --version
   npm --version
   git rev-parse HEAD  # Current commit
   ```

2. **Error Messages**: Complete error logs with stack traces

3. **Reproduction Steps**: Detailed steps to reproduce the issue

4. **Expected vs Actual Behavior**: What should happen vs what actually happens

5. **Browser/OS Information**: Relevant for frontend issues

6. **Configuration**: Relevant environment variables (sanitized)

---

## 🎯 Prevention Tips

### Regular Maintenance

- **Weekly**: Check logs for errors and warnings
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance review and optimization
- **Annually**: Security audit and infrastructure review

### Monitoring Setup

- **Application**: Health checks and error tracking
- **Database**: Query performance and connection monitoring
- **Infrastructure**: CPU, memory, and disk usage alerts
- **User Experience**: Core Web Vitals and error rates

### Best Practices

- **Code Quality**: Use TypeScript, ESLint, and Prettier
- **Testing**: Maintain high test coverage
- **Documentation**: Keep documentation updated
- **Backup**: Regular database and file backups
- **Security**: Regular security updates and audits

---

_Troubleshooting guide last updated: January 2025_

# Supabase Edge Functions

This directory contains Deno-based Edge Functions for the MaintAInPro CMMS application.

## Important Notes

### TypeScript Configuration

- These files use `@ts-nocheck` to disable TypeScript checking for VS Code
- They run in Deno environment, not Node.js
- Main project TypeScript configuration excludes this directory
- Use `deno.json` for Deno-specific configuration

### Environment

- **Runtime**: Deno (not Node.js)
- **TypeScript**: Disabled for IDE (enabled in runtime)
- **ESLint**: Separate configuration for Deno environment
- **Validation**: Handled by Supabase CLI and Deno runtime

### Functions

#### `escalation-checker/index.ts`

Automated escalation processing for work orders and maintenance tasks.

#### `notification-sender/index.ts`

Real-time notification delivery system for email and push notifications.

### Development

```bash
# Test locally with Deno
deno run --allow-net --allow-read --allow-env escalation-checker/index.ts
deno run --allow-net --allow-read --allow-env notification-sender/index.ts

# Deploy with Supabase CLI
supabase functions deploy escalation-checker
supabase functions deploy notification-sender
```

### Configuration Files

- `deno.json`: Deno configuration and dependencies
- `tsconfig.json`: TypeScript configuration for Deno
- `.eslintrc.json`: ESLint configuration for Deno environment
- `deno-types.d.ts`: Type declarations for Deno globals

## Why @ts-nocheck?

The `@ts-nocheck` comment at the top of each file disables TypeScript checking in VS Code because:

1. These files run in Deno environment, not Node.js
2. Deno has different module resolution and globals
3. VS Code TypeScript language service uses Node.js TypeScript configuration
4. This prevents false positive errors in the IDE
5. Actual type checking happens in Deno runtime during execution

The code is still type-safe and well-typed - we just disable IDE checking to prevent environment
conflicts.

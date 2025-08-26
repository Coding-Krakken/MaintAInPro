import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { storage } from '../storage';
import crypto from 'crypto';

dotenv.config();

const router = Router();

// Safe environment variables to expose
const SAFE_ENV = [
  'NODE_ENV',
  'TEST_AUTH_MODE',
  'PLAYWRIGHT',
  'DISABLE_RATE_LIMITING',
  'DATABASE_URL',
  'VERCEL',
  'VERCEL_ENV',
  'RAILWAY_STATIC_URL',
  'PORT',
];

router.get('/env', (req: Request, res: Response) => {
  const env: Record<string, string | undefined> = {};
  SAFE_ENV.forEach(key => {
    env[key] = process.env[key];
  });
  res.json(env);
});

router.get('/auth-mode', (req: Request, res: Response) => {
  res.json({
    TEST_AUTH_MODE: process.env.TEST_AUTH_MODE,
    NODE_ENV: process.env.NODE_ENV,
    PLAYWRIGHT: process.env.PLAYWRIGHT,
    DISABLE_RATE_LIMITING: process.env.DISABLE_RATE_LIMITING,
    authBypassActive: process.env.TEST_AUTH_MODE === 'true',
  });
});

router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await storage.getProfiles();
    res.json({
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        active: u.active,
      })),
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.get('/user/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await storage.getProfileByEmail(email);

    if (user) {
      const credentials = await storage.getUserCredentials(user.id);
      res.json({
        found: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          active: user.active,
        },
        hasCredentials: !!credentials,
      });
    } else {
      res.json({
        found: false,
        email,
      });
    }
  } catch (error) {
    console.error('Debug check user error:', error);
    res.status(500).json({ error: 'Failed to check user' });
  }
});

router.get('/reset-credentials', async (req: Request, res: Response) => {
  try {
    // Get all users
    const users = await storage.getProfiles();

    // Delete existing credentials
    const { db } = await import('../db');
    const { userCredentials } = await import('../../shared/schema');
    await db.delete(userCredentials);

    // Recreate credentials with the current pepper
    const { PasswordService } = await import('../services/auth/password.service');
    const defaultPassword = 'demo123';
    const credentialsList = [];

    for (const user of users) {
      const { hash, salt } = await PasswordService.hashPassword(defaultPassword);
      credentialsList.push({
        id: crypto.randomUUID(),
        userId: user.id,
        passwordHash: hash,
        passwordSalt: salt,
        mustChangePassword: false,
        passwordExpiresAt: null,
        previousPasswords: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await db.insert(userCredentials).values(credentialsList);

    res.json({
      success: true,
      message: `Reset credentials for ${users.length} users`,
      users: users.map(u => u.email),
    });
  } catch (error) {
    console.error('Reset credentials error:', error);
    res.status(500).json({ error: 'Failed to reset credentials' });
  }
});

router.get('/test-summary', (req: Request, res: Response) => {
  exec('npm run test:unit -- --reporter=json', { cwd: process.cwd() }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ summary: 'Test run failed', error: stderr });
    }
    try {
      const report = JSON.parse(stdout);
      res.json({ summary: report });
    } catch (_e) {
      res.json({ summary: 'Could not parse test output', error: stdout });
    }
  });
});

export default router;

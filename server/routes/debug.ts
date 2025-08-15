import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import { exec } from 'child_process';

dotenv.config();

const router = Router();

// Safe environment variables to expose
const SAFE_ENV = [
  'NODE_ENV',
  'DATABASE_URL',
  'VERCEL',
  'VERCEL_ENV',
  'RAILWAY_STATIC_URL',
  'PORT',
];

router.get('/env', (req: Request, res: Response) => {
  const env: Record<string, string | undefined> = {};
  SAFE_ENV.forEach((key) => {
    env[key] = process.env[key];
  });
  res.json(env);
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

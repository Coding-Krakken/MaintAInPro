import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer, createLogger } from 'vite';
import { type Server } from 'http';
import viteConfig from '../vite.config';
import { nanoid } from 'nanoid';

const viteLogger = createLogger();

export function log(message: string, source = 'express') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: 'custom',
  });

  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(import.meta.dirname, '..', 'client', 'index.html');

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, '..', 'dist', 'public');

  console.log('Checking for build directory at:', distPath);
  console.log('Directory exists:', fs.existsSync(distPath));

  if (!fs.existsSync(distPath)) {
    // In test environment, just serve a simple response instead of throwing
    if (process.env.NODE_ENV === 'test') {
      app.get('*', (req, res) => {
        res.status(200).send('Test mode - client build not required');
      });
      return;
    }

    console.error(`Could not find the build directory: ${distPath}`);
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  console.log('Setting up static file serving from:', distPath);

  // Custom file handler for PWA files before generic static middleware
  app.get('/sw.js', (req, res) => {
    const swPath = path.resolve(distPath, 'sw.js');
    console.log('Serving service worker from:', swPath);
    console.log('Service worker exists:', fs.existsSync(swPath));

    res.set({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    if (fs.existsSync(swPath)) {
      res.sendFile(swPath);
    } else {
      console.error('Service worker file not found at:', swPath);
      res.status(404).send('Service worker not found');
    }
  });

  app.get('/manifest.json', (req, res) => {
    const manifestPath = path.resolve(distPath, 'manifest.json');
    console.log('Serving manifest from:', manifestPath);
    console.log('Manifest exists:', fs.existsSync(manifestPath));

    res.set({
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });

    if (fs.existsSync(manifestPath)) {
      res.sendFile(manifestPath);
    } else {
      console.error('Manifest file not found at:', manifestPath);
      res.status(404).send('Manifest not found');
    }
  });

  // Generic static file middleware for everything else
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

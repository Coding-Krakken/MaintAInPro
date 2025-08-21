import express from 'express';
import request from 'supertest';
import { Server } from 'http';
import { registerRoutes } from '../../../server/routes';
import compression from 'compression';
import helmet from 'helmet';
import {
  securityStack,
  apiRateLimit,
  authRateLimit,
} from '../../../server/middleware/security.middleware';

/**
 * Test server setup for authentication integration tests
 * Creates an actual Express server with real routes and middleware
 */
export class AuthTestServer {
  private app: express.Application;
  private server: Server | null = null;

  constructor() {
    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // Essential middleware for auth testing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(compression());
    
    // Security headers but with relaxed settings for testing
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }));

    // Apply security stack
    this.app.use(securityStack);

    // Note: Skip rate limiting in tests to avoid interference
    // Rate limiting will be tested explicitly in specific test cases
  }

  /**
   * Initialize the server with all authentication routes
   */
  async initialize(): Promise<void> {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-' + Math.random();
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-' + Math.random();
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';
    process.env.TEST_AUTH_MODE = 'true'; // Enable test auth bypass for simpler testing
    process.env.DISABLE_RATE_LIMITING = 'true'; // Disable rate limiting for tests

    // Register all routes including authentication
    this.server = await registerRoutes(this.app);
  }

  /**
   * Get the Express application for supertest
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get supertest request object
   */
  request(): request.Test {
    return request(this.app);
  }

  /**
   * Start the server on a random port
   */
  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        reject(new Error('Server not initialized. Call initialize() first.'));
        return;
      }

      const server = this.server.listen(0, 'localhost', () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        resolve(port);
      });

      server.on('error', reject);
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Helper method to create a test user session
   * Handles rate limiting by retrying on 429 responses
   */
  async createTestUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<{ user: any; token: string; refreshToken: string; sessionId: string }> {
    // First register the user with retry logic for rate limiting
    let registerResponse;
    let attempts = 0;
    const maxAttempts = 3;

    do {
      registerResponse = await this.request()
        .post('/api/auth/register')
        .send({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName || 'Test',
          lastName: userData.lastName || 'User',
          role: userData.role || 'technician',
        });

      if (registerResponse.status === 429) {
        // Wait briefly and retry
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        attempts++;
      }
    } while (registerResponse.status === 429 && attempts < maxAttempts);

    if (registerResponse.status !== 201) {
      throw new Error(`Failed to register test user: ${registerResponse.status} - ${registerResponse.body.message || 'Unknown error'}`);
    }

    // Then login to get tokens with retry logic
    let loginResponse;
    attempts = 0;

    do {
      loginResponse = await this.request()
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      if (loginResponse.status === 429) {
        // Wait briefly and retry
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        attempts++;
      }
    } while (loginResponse.status === 429 && attempts < maxAttempts);

    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login test user: ${loginResponse.status} - ${loginResponse.body.message || 'Unknown error'}`);
    }

    return loginResponse.body;
  }

  /**
   * Helper to make authenticated requests
   */
  authenticatedRequest(token: string): request.Test {
    return this.request().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Helper to add small delays between requests to avoid rate limiting
   */
  async delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
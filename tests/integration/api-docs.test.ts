import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, initializeApp } from '../../server/index';
import { Server } from 'http';

describe('API Documentation Endpoint', () => {
  let server: Server;

  beforeAll(async () => {
    server = await initializeApp();
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  it('should serve Swagger UI at /api/api-docs/', async () => {
    const response = await request(app)
      .get('/api/api-docs/')
      .expect(200);
    
    expect(response.text).toContain('Swagger UI');
    expect(response.text).toContain('MaintAInPro CMMS API Documentation');
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  it('should redirect /api/api-docs to /api/api-docs/', async () => {
    const response = await request(app)
      .get('/api/api-docs')
      .expect(301);
    
    expect(response.headers.location).toBe('/api/api-docs/');
  });

  it('should serve OpenAPI spec at /api/api-docs/swagger.json', async () => {
    const response = await request(app)
      .get('/api/api-docs/swagger.json')
      .expect(200);
    
    expect(response.body.openapi).toBe('3.0.0');
    expect(response.body.info.title).toBe('MaintAInPro CMMS API');
    expect(response.body.info.version).toBe('1.0.0');
    expect(response.body.paths).toBeDefined();
    expect(response.body.components.schemas).toBeDefined();
  });

  it('should have documented endpoints in the OpenAPI spec', async () => {
    const response = await request(app)
      .get('/api/api-docs/swagger.json')
      .expect(200);
    
    const paths = response.body.paths;
    
    // Verify documented endpoints
    expect(paths['/health']).toBeDefined();
    expect(paths['/health/basic']).toBeDefined();
    expect(paths['/auth/login']).toBeDefined();
    expect(paths['/auth/logout']).toBeDefined();
    expect(paths['/profiles/me']).toBeDefined();
    expect(paths['/work-orders']).toBeDefined();
    expect(paths['/work-orders/{id}']).toBeDefined();
    expect(paths['/equipment']).toBeDefined();
    expect(paths['/parts']).toBeDefined();
  });

  it('should have security schemes defined', async () => {
    const response = await request(app)
      .get('/api/api-docs/swagger.json')
      .expect(200);
    
    const securitySchemes = response.body.components.securitySchemes;
    
    expect(securitySchemes.bearerAuth).toBeDefined();
    expect(securitySchemes.bearerAuth.type).toBe('http');
    expect(securitySchemes.bearerAuth.scheme).toBe('bearer');
    expect(securitySchemes.bearerAuth.bearerFormat).toBe('JWT');
    
    expect(securitySchemes.organizationHeader).toBeDefined();
    expect(securitySchemes.organizationHeader.type).toBe('apiKey');
    expect(securitySchemes.organizationHeader.in).toBe('header');
    expect(securitySchemes.organizationHeader.name).toBe('X-Organization-ID');
  });

  it('should have schema definitions', async () => {
    const response = await request(app)
      .get('/api/api-docs/swagger.json')
      .expect(200);
    
    const schemas = response.body.components.schemas;
    
    expect(schemas.WorkOrder).toBeDefined();
    expect(schemas.Equipment).toBeDefined();
    expect(schemas.Part).toBeDefined();
    expect(schemas.Profile).toBeDefined();
    expect(schemas.Error).toBeDefined();
  });
});
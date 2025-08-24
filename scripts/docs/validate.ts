#!/usr/bin/env tsx
/**
 * Validate OpenAPI 3.0 documentation
 * This script validates the generated OpenAPI specification for correctness
 */

import { specs } from '../../server/config/openapi';

async function validateDocs() {
  try {
    console.log('🔍 Validating OpenAPI 3.0 specification...');
    
    // Basic structure validation
    if (!specs.openapi) {
      throw new Error('Missing OpenAPI version');
    }
    
    if (!specs.info) {
      throw new Error('Missing API info');
    }
    
    if (!specs.info.title) {
      throw new Error('Missing API title');
    }
    
    if (!specs.info.version) {
      throw new Error('Missing API version');
    }
    
    // Check for paths
    const pathCount = Object.keys(specs.paths || {}).length;
    if (pathCount === 0) {
      throw new Error('No API paths found - ensure JSDoc annotations are present');
    }
    
    // Check for components
    if (!specs.components) {
      console.warn('⚠️  No components defined - consider adding reusable schemas');
    }
    
    // Check for security schemes
    if (!specs.components?.securitySchemes) {
      throw new Error('No security schemes defined');
    }
    
    // Validate each path
    let totalEndpoints = 0;
    for (const [path, methods] of Object.entries(specs.paths || {})) {
      if (!methods || typeof methods !== 'object') {
        throw new Error(`Invalid path definition for ${path}`);
      }
      
      for (const [method, definition] of Object.entries(methods)) {
        if (typeof definition !== 'object' || !definition) {
          throw new Error(`Invalid method definition for ${method.toUpperCase()} ${path}`);
        }
        
        // Check for required fields
        if (!definition.summary && !definition.description) {
          console.warn(`⚠️  Missing summary/description for ${method.toUpperCase()} ${path}`);
        }
        
        if (!definition.responses) {
          throw new Error(`Missing responses for ${method.toUpperCase()} ${path}`);
        }
        
        totalEndpoints++;
      }
    }
    
    console.log(`✅ OpenAPI specification is valid`);
    console.log(`📊 API Info:`);
    console.log(`   - Title: ${specs.info.title}`);
    console.log(`   - Version: ${specs.info.version}`);
    console.log(`   - OpenAPI: ${specs.openapi}`);
    console.log(`   - Paths: ${pathCount}`);
    console.log(`   - Endpoints: ${totalEndpoints}`);
    console.log(`   - Schemas: ${Object.keys(specs.components?.schemas || {}).length}`);
    console.log(`   - Security Schemes: ${Object.keys(specs.components?.securitySchemes || {}).length}`);
    
    if (totalEndpoints < 5) {
      console.warn('⚠️  Low endpoint count - consider adding more JSDoc annotations');
    }
    
    console.log('🎉 Validation completed successfully!');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateDocs();
}

export { validateDocs };
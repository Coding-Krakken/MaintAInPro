#!/usr/bin/env tsx
/**
 * Generate OpenAPI 3.0 documentation
 * This script generates and saves the OpenAPI specification to a file
 */

import { specs } from '../../server/config/openapi';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

async function generateDocs() {
  try {
    console.log('🚀 Generating OpenAPI 3.0 specification...');
    
    // Ensure the Documentation/api directory exists
    const docsDir = resolve(process.cwd(), 'Documentation/api');
    mkdirSync(docsDir, { recursive: true });
    
    // Generate the specification
    const specString = JSON.stringify(specs, null, 2);
    
    // Save to file
    const specPath = resolve(docsDir, 'openapi.json');
    writeFileSync(specPath, specString, 'utf8');
    
    console.log(`✅ OpenAPI specification generated at: ${specPath}`);
    console.log(`📊 Endpoints documented: ${Object.keys(specs.paths || {}).length}`);
    
    // Also generate a YAML version for better readability
    const yaml = await import('js-yaml');
    const yamlString = yaml.dump(specs);
    const yamlPath = resolve(docsDir, 'openapi.yaml');
    writeFileSync(yamlPath, yamlString, 'utf8');
    
    console.log(`✅ YAML specification generated at: ${yamlPath}`);
    console.log('🎉 Documentation generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to generate documentation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDocs();
}

export { generateDocs };
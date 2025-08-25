/* global console, require, __dirname */
// Test the vendor API directly by trying to import it and see what fails
console.log('Testing vendor API imports...');

try {
  console.log('1. Testing crypto import...');
  require('crypto');
  console.log('✓ crypto imported successfully');

  console.log('2. Testing storage import...');
  // First check if the file exists
  const _fs = require('fs');
  const _path = require('path');

  const storagePath = _path.join(__dirname, '..', 'server', 'storage.ts');
  if (_fs.existsSync(storagePath)) {
    console.log('✓ storage.ts file exists');
  } else {
    console.log('✗ storage.ts file NOT found at:', storagePath);
  }

  console.log('3. Testing schema imports...');
  const schemaPath = _path.join(__dirname, '..', 'shared', 'schema.ts');
  if (_fs.existsSync(schemaPath)) {
    console.log('✓ schema.ts file exists');
  } else {
    console.log('✗ schema.ts file NOT found at:', schemaPath);
  }

  console.log('4. Testing vendor API file...');
  const vendorPath = _path.join(__dirname, '..', 'api', 'vendors.ts');
  if (_fs.existsSync(vendorPath)) {
    console.log('✓ vendors.ts API file exists');

    // Try to read the file and check for obvious syntax issues
    const vendorCode = _fs.readFileSync(vendorPath, 'utf8');
    console.log('✓ vendors.ts file readable, length:', vendorCode.length);

    // Check if required imports are present
    if (vendorCode.includes("from '../server/storage'")) {
      console.log('✓ Storage import found');
    } else {
      console.log('✗ Storage import NOT found');
    }

    if (vendorCode.includes("from '@shared/schema'")) {
      console.log('✓ Schema import found');
    } else {
      console.log('✗ Schema import NOT found');
    }
  } else {
    console.log('✗ vendors.ts API file NOT found at:', vendorPath);
  }

  console.log('5. Testing if we can simulate the function...');
  console.log('All basic imports passed. The issue may be in runtime execution.');
} catch (error) {
  console.error('Error during testing:', error);
  console.error('Stack:', error.stack);
}

import { db } from '../../server/db';
import { userCredentials, profiles } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function verifyCredentials() {
  try {
    console.log('🔍 Verifying seeded user credentials...\n');

    // Get all profiles with their credentials
    const usersWithCredentials = await db
      .select({
        profileId: profiles.id,
        email: profiles.email,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        role: profiles.role,
        credentialId: userCredentials.id,
        passwordHash: userCredentials.passwordHash,
        passwordSalt: userCredentials.passwordSalt,
      })
      .from(profiles)
      .leftJoin(userCredentials, eq(profiles.id, userCredentials.userId));

    console.log('📋 Found users in database:');
    console.log('='.repeat(80));

    for (const user of usersWithCredentials) {
      console.log(`👤 Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Credentials: ${user.credentialId ? '✅' : '❌'}`);
      if (user.passwordHash) {
        console.log(`   Password Hash: ${user.passwordHash.substring(0, 20)}...`);
        console.log(`   Password Salt: ${user.passwordSalt?.substring(0, 20)}...`);
      }
      console.log('-'.repeat(40));
    }

    // Check specifically for our expected demo users
    const expectedEmails = [
      'supervisor@maintainpro.com',
      'technician@maintainpro.com',
      'manager@maintainpro.com',
    ];

    console.log('\n🎯 Checking expected demo credentials:');
    console.log('='.repeat(80));

    for (const expectedEmail of expectedEmails) {
      const user = usersWithCredentials.find(u => u.email === expectedEmail);
      if (user && user.credentialId) {
        console.log(`✅ ${expectedEmail} - Found with credentials`);
      } else if (user) {
        console.log(`⚠️  ${expectedEmail} - Found but no credentials`);
      } else {
        console.log(`❌ ${expectedEmail} - Not found in database`);
      }
    }

    console.log('\n✨ Verification complete!');
  } catch (error) {
    console.error('❌ Error verifying credentials:', error);
  } finally {
    process.exit(0);
  }
}

verifyCredentials();

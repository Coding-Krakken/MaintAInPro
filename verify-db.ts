import { db } from './server/db';
import { userCredentials, profiles } from './shared/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function verifyCredentials() {
  try {
    console.log('🔍 Verifying seeded user credentials...\n');

    // Get all profiles
    const allProfiles = await db.select().from(profiles);
    console.log(`📊 Total profiles in database: ${allProfiles.length}`);

    // Get all user credentials
    const allCredentials = await db.select().from(userCredentials);
    console.log(`🔐 Total user credentials in database: ${allCredentials.length}\n`);

    // Get profiles with their credentials
    const usersWithCredentials = await db
      .select({
        profileId: profiles.id,
        email: profiles.email,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        role: profiles.role,
        credentialId: userCredentials.id,
      })
      .from(profiles)
      .leftJoin(userCredentials, eq(profiles.id, userCredentials.userId));

    console.log('📋 Users and their credential status:');
    console.log('='.repeat(80));

    for (const user of usersWithCredentials) {
      const status = user.credentialId ? '✅ Has credentials' : '❌ No credentials';
      console.log(`${user.email} (${user.role}) - ${status}`);
    }

    console.log('\n🎯 Expected demo users:');
    console.log('='.repeat(80));

    const expectedEmails = [
      'supervisor@maintainpro.com',
      'technician@maintainpro.com',
      'manager@maintainpro.com',
    ];

    for (const expectedEmail of expectedEmails) {
      const user = usersWithCredentials.find(u => u.email === expectedEmail);
      if (user) {
        const status = user.credentialId
          ? '✅ Found with credentials'
          : '⚠️ Found but no credentials';
        console.log(`${expectedEmail} - ${status}`);
      } else {
        console.log(`${expectedEmail} - ❌ Not found in database`);
      }
    }

    console.log('\n✨ Verification complete!');
  } catch (error) {
    console.error('❌ Error verifying credentials:', error);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

verifyCredentials();

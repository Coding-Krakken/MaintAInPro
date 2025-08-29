import { db } from '../../server/db';
import { userCredentials, profiles } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDuplicateCredentials() {
  try {
    console.log('🧹 Cleaning up duplicate user credentials...\n');

    // Get all profiles that have credentials
    const profilesWithCredentials = await db
      .select({
        profileId: profiles.id,
        email: profiles.email,
        role: profiles.role,
      })
      .from(profiles)
      .innerJoin(userCredentials, eq(profiles.id, userCredentials.userId));

    console.log(`Found ${profilesWithCredentials.length} profiles with credentials`);

    // Group by profile ID and keep only the most recent credential
    const profileIds = [...new Set(profilesWithCredentials.map(p => p.profileId))];

    for (const profileId of profileIds) {
      // Get all credentials for this profile, ordered by creation date (newest first)
      const credentials = await db
        .select()
        .from(userCredentials)
        .where(eq(userCredentials.userId, profileId as string))
        .orderBy(desc(userCredentials.createdAt));

      if (credentials.length > 1) {
        console.log(
          `Profile ${profileId} has ${credentials.length} credentials, keeping newest...`
        );

        // Keep the first (newest) credential, delete the rest
        const credentialsToDelete = credentials.slice(1);
        for (const cred of credentialsToDelete) {
          await db.delete(userCredentials).where(eq(userCredentials.id, cred.id));
          console.log(`  🗑️  Deleted duplicate credential ${cred.id}`);
        }
      }
    }

    console.log('\n✨ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
  } finally {
    process.exit(0);
  }
}

cleanupDuplicateCredentials();

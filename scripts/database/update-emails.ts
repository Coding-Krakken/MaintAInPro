import { db } from '../../server/db';
import { profiles } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function updateProfileEmails() {
  try {
    console.log('🔄 Updating profile emails to match demo credentials...\n');

    // Update existing profiles to use the correct email format
    const updates = [
      { oldEmail: 'supervisor@company.com', newEmail: 'supervisor@maintainpro.com' },
      { oldEmail: 'technician@company.com', newEmail: 'technician@maintainpro.com' },
      { oldEmail: 'manager@company.com', newEmail: 'manager@maintainpro.com' },
    ];

    for (const { oldEmail, newEmail } of updates) {
      // Check if new email already exists
      const existingNew = await db.select().from(profiles).where(eq(profiles.email, newEmail));
      if (existingNew.length > 0) {
        console.log(`⚠️  ${newEmail} already exists, skipping...`);
        continue;
      }

      // Update the first occurrence of old email to new email
      const result = await db
        .update(profiles)
        .set({ email: newEmail })
        .where(eq(profiles.email, oldEmail))
        .returning();

      if (result.length > 0) {
        console.log(`✅ Updated ${oldEmail} → ${newEmail}`);
      } else {
        console.log(`❌ No profile found with email ${oldEmail}`);
      }
    }

    console.log('\n✨ Email updates complete!');
  } catch (error) {
    console.error('❌ Error updating emails:', error);
  } finally {
    process.exit(0);
  }
}

updateProfileEmails();

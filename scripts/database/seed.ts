import { DatabaseStorage } from '../../server/dbStorage';
import { db } from '../../server/db';
import { userCredentials } from '../../shared/schema';
import { hashPassword } from './hashPassword';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    const storage = new DatabaseStorage();
    await storage.initializeData();

    // Seed user credentials for each test user
    const users = [
      { email: 'supervisor@maintainpro.com', password: 'demo123' },
      { email: 'technician@maintainpro.com', password: 'demo123' },
      { email: 'manager@maintainpro.com', password: 'demo123' },
    ];

    for (const { email, password } of users) {
      const profile = await storage.getProfileByEmail(email);
      if (!profile) continue;
      const pepper = process.env.PASSWORD_PEPPER;
      console.log(`[SEED] Seeding user: ${email}`);
      console.log(`[SEED] Pepper: ${pepper}`);
      const { hash, salt } = await hashPassword(password);
      console.log(`[SEED] Raw password: ${password}`);
      console.log(`[SEED] Hashed password: ${hash}`);
      await db.insert(userCredentials).values({
        id: crypto.randomUUID(),
        userId: profile.id,
        passwordHash: hash,
        passwordSalt: salt,
        mustChangePassword: false,
        previousPasswords: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log('Database seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
})();

import bcrypt from 'bcryptjs';

const PEPPER = process.env.PASSWORD_PEPPER || '';

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(12);
  const pepperedPassword = password + PEPPER;
  const hash = await bcrypt.hash(pepperedPassword, salt);
  return { hash, salt };
}

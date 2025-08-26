import { Request, Response } from 'express';
import { storage } from '../server/storage';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await storage.getProfiles();
    res.json({
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        active: u.active,
      })),
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const checkUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await storage.getProfileByEmail(email);

    if (user) {
      const credentials = await storage.getUserCredentials(user.id);
      res.json({
        found: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          active: user.active,
        },
        hasCredentials: !!credentials,
      });
    } else {
      res.json({
        found: false,
        email,
      });
    }
  } catch (error) {
    console.error('Debug check user error:', error);
    res.status(500).json({ error: 'Failed to check user' });
  }
};

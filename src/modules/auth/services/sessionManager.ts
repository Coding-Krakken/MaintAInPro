export interface SessionInfo {
  id: string;
  userId: string;
  device: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  createdAt: Date;
  lastActive: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  failureReason?: string;
}

export interface AccountLockout {
  email: string;
  attempts: number;
  lockedUntil: Date;
  lockoutReason: string;
}

export class SessionManager {
  private static readonly LOCKOUT_KEY_PREFIX = 'lockout_';
  private static readonly ATTEMPT_KEY_PREFIX = 'attempts_';
  private static readonly SESSION_KEY_PREFIX = 'session_';

  private maxAttempts: number;
  private lockoutDuration: number; // minutes
  private sessionDuration: number; // minutes

  constructor(
    maxAttempts: number = 5,
    lockoutDuration: number = 15,
    sessionDuration: number = 60
  ) {
    this.maxAttempts = maxAttempts;
    this.lockoutDuration = lockoutDuration;
    this.sessionDuration = sessionDuration;
  }

  // Account lockout management
  async recordLoginAttempt(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    failureReason?: string
  ): Promise<void> {
    const attempt: LoginAttempt = {
      id: crypto.randomUUID(),
      email,
      ipAddress,
      userAgent,
      success,
      timestamp: new Date(),
      ...(failureReason && { failureReason }),
    };

    // Store attempt in local storage (in production, this would be in a database)
    const attempts = this.getLoginAttempts(email);
    attempts.push(attempt);

    // Keep only recent attempts (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAttempts = attempts.filter(a => a.timestamp > oneDayAgo);

    localStorage.setItem(
      `${SessionManager.ATTEMPT_KEY_PREFIX}${email}`,
      JSON.stringify(recentAttempts)
    );

    // Check if account should be locked
    if (!success) {
      await this.checkAndLockAccount(email);
    } else {
      // Clear lockout on successful login
      await this.clearAccountLockout(email);
    }
  }

  private async checkAndLockAccount(email: string): Promise<void> {
    const attempts = this.getLoginAttempts(email);
    const failedAttempts = attempts.filter(a => !a.success);

    // Count failed attempts in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFailedAttempts = failedAttempts.filter(
      a => a.timestamp > oneHourAgo
    );

    if (recentFailedAttempts.length >= this.maxAttempts) {
      const lockout: AccountLockout = {
        email,
        attempts: recentFailedAttempts.length,
        lockedUntil: new Date(Date.now() + this.lockoutDuration * 60 * 1000),
        lockoutReason: `Too many failed login attempts (${recentFailedAttempts.length})`,
      };

      localStorage.setItem(
        `${SessionManager.LOCKOUT_KEY_PREFIX}${email}`,
        JSON.stringify(lockout)
      );
    }
  }

  async isAccountLocked(
    email: string
  ): Promise<{ locked: boolean; lockout?: AccountLockout }> {
    const lockoutData = localStorage.getItem(
      `${SessionManager.LOCKOUT_KEY_PREFIX}${email}`
    );

    if (!lockoutData) {
      return { locked: false };
    }

    const lockout: AccountLockout = JSON.parse(lockoutData);
    lockout.lockedUntil = new Date(lockout.lockedUntil);

    // Check if lockout has expired
    if (lockout.lockedUntil < new Date()) {
      await this.clearAccountLockout(email);
      return { locked: false };
    }

    return { locked: true, lockout };
  }

  async clearAccountLockout(email: string): Promise<void> {
    localStorage.removeItem(`${SessionManager.LOCKOUT_KEY_PREFIX}${email}`);
    localStorage.removeItem(`${SessionManager.ATTEMPT_KEY_PREFIX}${email}`);
  }

  private getLoginAttempts(email: string): LoginAttempt[] {
    const attemptsData = localStorage.getItem(
      `${SessionManager.ATTEMPT_KEY_PREFIX}${email}`
    );
    if (!attemptsData) return [];

    const attempts = JSON.parse(attemptsData) as LoginAttempt[];
    return attempts.map(a => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }));
  }

  // Session management
  async createSession(
    userId: string,
    device: string,
    ipAddress: string,
    userAgent: string
  ): Promise<SessionInfo> {
    const sessionInfo: SessionInfo = {
      id: crypto.randomUUID(),
      userId,
      device,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      lastActive: new Date(),
      expiresAt: new Date(Date.now() + this.sessionDuration * 60 * 1000),
      isActive: true,
    };

    // Store session info
    localStorage.setItem(
      `${SessionManager.SESSION_KEY_PREFIX}${sessionInfo.id}`,
      JSON.stringify(sessionInfo)
    );

    return sessionInfo;
  }

  async getSession(sessionId: string): Promise<SessionInfo | null> {
    const sessionData = localStorage.getItem(
      `${SessionManager.SESSION_KEY_PREFIX}${sessionId}`
    );
    if (!sessionData) return null;

    const session: SessionInfo = JSON.parse(sessionData);
    session.createdAt = new Date(session.createdAt);
    session.lastActive = new Date(session.lastActive);
    session.expiresAt = new Date(session.expiresAt);

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.invalidateSession(sessionId);
      return null;
    }

    return session;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.lastActive = new Date();
    session.expiresAt = new Date(Date.now() + this.sessionDuration * 60 * 1000);

    localStorage.setItem(
      `${SessionManager.SESSION_KEY_PREFIX}${sessionId}`,
      JSON.stringify(session)
    );
  }

  async invalidateSession(sessionId: string): Promise<void> {
    localStorage.removeItem(`${SessionManager.SESSION_KEY_PREFIX}${sessionId}`);
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions: SessionInfo[] = [];

    // In a real app, this would be a database query
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SessionManager.SESSION_KEY_PREFIX)) {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.createdAt = new Date(session.createdAt);
          session.lastActive = new Date(session.lastActive);
          session.expiresAt = new Date(session.expiresAt);

          if (session.userId === userId && session.isActive) {
            sessions.push(session);
          }
        }
      }
    }

    return sessions;
  }

  // Security utilities
  getDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    return btoa(
      navigator.userAgent +
        navigator.language +
        screen.width +
        screen.height +
        new Date().getTimezoneOffset() +
        (canvas.toDataURL() || '')
    );
  }

  async getClientInfo(): Promise<{
    ipAddress: string;
    userAgent: string;
    device: string;
  }> {
    const userAgent = navigator.userAgent;
    const device = this.getDeviceFingerprint();

    // In a real app, you'd get the IP from the server
    // For now, we'll use a placeholder
    const ipAddress = '192.168.1.1'; // This would come from the server

    return {
      ipAddress,
      userAgent,
      device,
    };
  }

  // Cleanup expired sessions and attempts
  async cleanup(): Promise<void> {
    const now = new Date();

    // Clean up expired sessions
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SessionManager.SESSION_KEY_PREFIX)) {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (new Date(session.expiresAt) < now) {
            localStorage.removeItem(key);
          }
        }
      }
    }

    // Clean up expired lockouts
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SessionManager.LOCKOUT_KEY_PREFIX)) {
        const lockoutData = localStorage.getItem(key);
        if (lockoutData) {
          const lockout = JSON.parse(lockoutData);
          if (new Date(lockout.lockedUntil) < now) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  }
}

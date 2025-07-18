import { supabase } from '../../../lib/supabase';
import type { User } from '../types/auth';
import { mfaService } from './mfaService';

interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  failureReason?: string;
  mfaRequired?: boolean;
  mfaCompleted?: boolean;
}

interface SessionData {
  user: User;
  isAuthenticated: boolean;
  lastActivity: Date;
  mfaVerified: boolean;
  sessionId: string;
  expiresAt: Date;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
  };
}

interface AccountLockout {
  email: string;
  lockedUntil: Date;
  attemptCount: number;
  lockoutReason: string;
}

interface SessionValidationResult {
  isValid: boolean;
  requiresMFA: boolean;
  user?: User;
  error?: string;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'maintainpro_session';
  private static readonly ATTEMPT_KEY_PREFIX = 'login_attempts_';
  private static readonly LOCKOUT_KEY_PREFIX = 'account_lockout_';
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly MFA_GRACE_PERIOD = 5 * 60 * 1000; // 5 minutes

  private sessionTimer: NodeJS.Timeout | null = null;

  /**
   * Enhanced login with MFA support
   */
  async login(
    email: string,
    password: string,
    mfaCode?: string,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown'
  ): Promise<SessionValidationResult> {
    try {
      // Check if account is locked
      const lockoutStatus = await this.checkAccountLockout(email);
      if (lockoutStatus.isLocked) {
        return {
          isValid: false,
          requiresMFA: false,
          error: lockoutStatus.message || 'Account is locked',
        };
      }

      // Attempt primary authentication
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError || !authData.user) {
        await this.recordLoginAttempt(
          email,
          false,
          ipAddress,
          userAgent,
          authError?.message || 'Authentication failed'
        );
        return {
          isValid: false,
          requiresMFA: false,
          error: authError?.message || 'Authentication failed',
        };
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!userProfile) {
        return {
          isValid: false,
          requiresMFA: false,
          error: 'User profile not found',
        };
      }

      // Check if MFA is required
      const mfaStatus = await mfaService.getMFAStatus(authData.user.id);
      if (mfaStatus.enabled) {
        if (!mfaCode) {
          // MFA required but not provided
          return {
            isValid: false,
            requiresMFA: true,
            user: userProfile,
          };
        }

        // Verify MFA code
        const mfaResult = await mfaService.verifyMFA(authData.user.id, mfaCode);
        if (!mfaResult.success) {
          await this.recordLoginAttempt(
            email,
            false,
            ipAddress,
            userAgent,
            `MFA verification failed: ${mfaResult.error}`,
            true,
            false
          );
          return {
            isValid: false,
            requiresMFA: true,
            user: userProfile,
            error: mfaResult.error || 'MFA verification failed',
          };
        }
      }

      // Create session
      const sessionData: SessionData = {
        user: userProfile,
        isAuthenticated: true,
        lastActivity: new Date(),
        mfaVerified: mfaStatus.enabled,
        sessionId: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + SessionManager.SESSION_TIMEOUT),
        deviceInfo: {
          userAgent,
          ipAddress,
        },
      };

      // Store session
      this.storeSession(sessionData);

      // Record successful login
      await this.recordLoginAttempt(
        email,
        true,
        ipAddress,
        userAgent,
        undefined,
        mfaStatus.enabled,
        mfaStatus.enabled
      );

      // Clear any existing lockout
      await this.clearAccountLockout(email);

      // Start session timer
      this.startSessionTimer();

      return {
        isValid: true,
        requiresMFA: false,
        user: userProfile,
      };
    } catch (error) {
      await this.recordLoginAttempt(
        email,
        false,
        ipAddress,
        userAgent,
        error instanceof Error ? error.message : 'Unknown error'
      );
      return {
        isValid: false,
        requiresMFA: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Enhanced session validation with MFA check
   */
  async validateSession(): Promise<SessionValidationResult> {
    try {
      const sessionData = this.getStoredSession();
      if (!sessionData) {
        return {
          isValid: false,
          requiresMFA: false,
          error: 'No session found',
        };
      }

      // Check if session is expired
      if (new Date() > sessionData.expiresAt) {
        this.clearSession();
        return {
          isValid: false,
          requiresMFA: false,
          error: 'Session expired',
        };
      }

      // Validate with Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        this.clearSession();
        return {
          isValid: false,
          requiresMFA: false,
          error: 'Session invalid',
        };
      }

      // Check MFA status for sensitive operations
      const mfaStatus = await mfaService.getMFAStatus(user.id);
      if (mfaStatus.enabled) {
        const mfaGracePeriod = new Date(
          sessionData.lastActivity.getTime() + SessionManager.MFA_GRACE_PERIOD
        );

        if (new Date() > mfaGracePeriod && !sessionData.mfaVerified) {
          return {
            isValid: false,
            requiresMFA: true,
            user: sessionData.user,
            error: 'MFA verification required',
          };
        }
      }

      // Update session activity
      sessionData.lastActivity = new Date();
      sessionData.expiresAt = new Date(
        Date.now() + SessionManager.SESSION_TIMEOUT
      );
      this.storeSession(sessionData);

      return {
        isValid: true,
        requiresMFA: false,
        user: sessionData.user,
      };
    } catch (error) {
      return {
        isValid: false,
        requiresMFA: false,
        error:
          error instanceof Error ? error.message : 'Session validation failed',
      };
    }
  }

  /**
   * Record login attempt with MFA tracking
   */
  async recordLoginAttempt(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    failureReason?: string,
    mfaRequired?: boolean,
    mfaCompleted?: boolean
  ): Promise<void> {
    const attempt: LoginAttempt = {
      id: crypto.randomUUID(),
      email,
      ipAddress,
      userAgent,
      success,
      timestamp: new Date(),
      ...(failureReason && { failureReason }),
      ...(mfaRequired !== undefined && { mfaRequired }),
      ...(mfaCompleted !== undefined && { mfaCompleted }),
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

  /**
   * Store session data
   */
  private storeSession(sessionData: SessionData): void {
    try {
      const serializedData = JSON.stringify({
        ...sessionData,
        lastActivity: sessionData.lastActivity.toISOString(),
        expiresAt: sessionData.expiresAt.toISOString(),
      });
      localStorage.setItem(SessionManager.SESSION_KEY, serializedData);
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Get stored session data
   */
  private getStoredSession(): SessionData | null {
    try {
      const stored = localStorage.getItem(SessionManager.SESSION_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return {
        ...data,
        lastActivity: new Date(data.lastActivity),
        expiresAt: new Date(data.expiresAt),
      };
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      return null;
    }
  }

  /**
   * Clear session
   */
  clearSession(): void {
    localStorage.removeItem(SessionManager.SESSION_KEY);
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Start session timer
   */
  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.clearSession();
      window.location.href = '/login?reason=timeout';
    }, SessionManager.SESSION_TIMEOUT);
  }

  /**
   * Check if account is locked
   */
  private async checkAccountLockout(
    email: string
  ): Promise<{ isLocked: boolean; message?: string }> {
    try {
      const lockoutData = localStorage.getItem(
        `${SessionManager.LOCKOUT_KEY_PREFIX}${email}`
      );
      if (!lockoutData) return { isLocked: false };

      const lockout: AccountLockout = JSON.parse(lockoutData);

      if (new Date() < new Date(lockout.lockedUntil)) {
        return {
          isLocked: true,
          message: `Account locked until ${new Date(lockout.lockedUntil).toLocaleString()}. Reason: ${lockout.lockoutReason}`,
        };
      }

      // Lockout expired, clear it
      await this.clearAccountLockout(email);
      return { isLocked: false };
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return { isLocked: false };
    }
  }

  /**
   * Get login attempts for an email
   */
  private getLoginAttempts(email: string): LoginAttempt[] {
    try {
      const stored = localStorage.getItem(
        `${SessionManager.ATTEMPT_KEY_PREFIX}${email}`
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting login attempts:', error);
      return [];
    }
  }

  /**
   * Check if account should be locked after failed attempts
   */
  private async checkAndLockAccount(email: string): Promise<void> {
    try {
      const attempts = this.getLoginAttempts(email);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentFailures = attempts.filter(
        (a: LoginAttempt) => !a.success && a.timestamp > oneDayAgo
      );

      if (recentFailures.length >= 5) {
        const lockout: AccountLockout = {
          email,
          lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          attemptCount: recentFailures.length,
          lockoutReason: 'Too many failed login attempts',
        };

        localStorage.setItem(
          `${SessionManager.LOCKOUT_KEY_PREFIX}${email}`,
          JSON.stringify(lockout)
        );
      }
    } catch (error) {
      console.error('Error checking account lockout:', error);
    }
  }

  /**
   * Clear account lockout
   */
  private async clearAccountLockout(email: string): Promise<void> {
    try {
      localStorage.removeItem(`${SessionManager.LOCKOUT_KEY_PREFIX}${email}`);
    } catch (error) {
      console.error('Error clearing account lockout:', error);
    }
  }
}

import { supabase } from '../../../lib/supabase';

export interface MFASetupData {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
}

export interface MFAStatus {
  enabled: boolean;
  methods: ('totp' | 'sms' | 'email')[];
  lastUsed?: Date;
  backupCodesRemaining?: number;
}

export class MFAService {
  private static readonly MFA_ATTEMPTS_KEY = 'mfa_attempts_';
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Initialize TOTP (Time-based One-Time Password) setup
   */
  async initializeTOTP(userId: string): Promise<MFASetupData> {
    try {
      // Generate TOTP secret
      const response = await supabase.rpc('generate_totp_secret', {
        user_id: userId,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { secret } = response.data;

      // Generate QR code data
      const qrCode = await this.generateQRCode(userId, secret);

      // Generate backup codes
      const backupCodes = await this.generateBackupCodes(userId);

      return {
        qrCode,
        secret,
        backupCodes,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to initialize TOTP'
      );
    }
  }

  /**
   * Generate QR code for TOTP setup
   */
  private async generateQRCode(
    userId: string,
    secret: string
  ): Promise<string> {
    try {
      // Get user email from database
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      // Generate TOTP URI
      const issuer = 'MaintAInPro';
      const label = encodeURIComponent(`${issuer}:${user.email}`);
      const otpUri = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

      // Generate QR code using a QR code library (you'll need to install qrcode)
      const QRCode = await import('qrcode');
      const qrCodeDataURL = await QRCode.toDataURL(otpUri);

      return qrCodeDataURL;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate QR code'
      );
    }
  }

  /**
   * Generate backup codes for MFA
   */
  private async generateBackupCodes(userId: string): Promise<string[]> {
    try {
      const response = await supabase.rpc('generate_backup_codes', {
        user_id: userId,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to generate backup codes'
      );
    }
  }

  /**
   * Verify TOTP code and enable MFA
   */
  async verifyAndEnableTOTP(
    userId: string,
    code: string,
    secret: string
  ): Promise<MFAVerificationResult> {
    try {
      // Check if user is locked out
      const lockoutCheck = await this.checkLockout(userId);
      if (lockoutCheck.isLockedOut) {
        return {
          success: false,
          error: `Account locked. Try again in ${Math.ceil(lockoutCheck.remainingTime / 60000)} minutes.`,
        };
      }

      // Verify TOTP code
      const response = await supabase.rpc('verify_totp', {
        user_id: userId,
        token: code,
        secret: secret,
      });

      if (response.error) {
        await this.recordFailedAttempt(userId);
        return {
          success: false,
          error: response.error.message,
          remainingAttempts: lockoutCheck.remainingAttempts - 1,
        };
      }

      if (!response.data) {
        await this.recordFailedAttempt(userId);
        return {
          success: false,
          error: 'Invalid verification code',
          remainingAttempts: lockoutCheck.remainingAttempts - 1,
        };
      }

      // Enable MFA for user
      await supabase
        .from('users')
        .update({
          mfa_enabled: true,
          mfa_secret: secret,
          mfa_methods: ['totp'],
          mfa_enabled_at: new Date(),
        })
        .eq('id', userId);

      // Clear failed attempts
      await this.clearFailedAttempts(userId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Verify MFA code during login
   */
  async verifyMFA(
    userId: string,
    code: string
  ): Promise<MFAVerificationResult> {
    try {
      // Check if user is locked out
      const lockoutCheck = await this.checkLockout(userId);
      if (lockoutCheck.isLockedOut) {
        return {
          success: false,
          error: `Account locked. Try again in ${Math.ceil(lockoutCheck.remainingTime / 60000)} minutes.`,
        };
      }

      // Get user's MFA settings
      const { data: user } = await supabase
        .from('users')
        .select('mfa_enabled, mfa_secret, mfa_methods')
        .eq('id', userId)
        .single();

      if (!user || !user.mfa_enabled) {
        return {
          success: false,
          error: 'MFA not enabled for this user',
        };
      }

      // Try backup code first
      if (code.length === 8) {
        const backupResult = await this.verifyBackupCode(userId, code);
        if (backupResult.success) {
          await this.clearFailedAttempts(userId);
          return backupResult;
        }
      }

      // Verify TOTP code
      const response = await supabase.rpc('verify_totp', {
        user_id: userId,
        token: code,
        secret: user.mfa_secret,
      });

      if (response.error || !response.data) {
        await this.recordFailedAttempt(userId);
        return {
          success: false,
          error: 'Invalid verification code',
          remainingAttempts: lockoutCheck.remainingAttempts - 1,
        };
      }

      // Update last used MFA
      await supabase
        .from('users')
        .update({ mfa_last_used: new Date() })
        .eq('id', userId);

      // Clear failed attempts
      await this.clearFailedAttempts(userId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(
    userId: string,
    code: string
  ): Promise<MFAVerificationResult> {
    try {
      const response = await supabase.rpc('verify_backup_code', {
        user_id: userId,
        code: code,
      });

      if (response.error || !response.data) {
        return {
          success: false,
          error: 'Invalid backup code',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Backup code verification failed',
      };
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(
    userId: string,
    password: string
  ): Promise<MFAVerificationResult> {
    try {
      // Verify password before disabling MFA
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Verify password
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        return {
          success: false,
          error: 'Invalid password',
        };
      }

      // Disable MFA
      await supabase
        .from('users')
        .update({
          mfa_enabled: false,
          mfa_secret: null,
          mfa_methods: null,
          mfa_enabled_at: null,
        })
        .eq('id', userId);

      // Clear backup codes
      await supabase.rpc('clear_backup_codes', { user_id: userId });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disable MFA',
      };
    }
  }

  /**
   * Get MFA status for user
   */
  async getMFAStatus(userId: string): Promise<MFAStatus> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('mfa_enabled, mfa_methods, mfa_last_used')
        .eq('id', userId)
        .single();

      if (!user) {
        return {
          enabled: false,
          methods: [],
        };
      }

      // Get remaining backup codes count
      const { data: backupCodesCount } = await supabase.rpc(
        'get_backup_codes_count',
        { user_id: userId }
      );

      const result: MFAStatus = {
        enabled: user.mfa_enabled || false,
        methods: user.mfa_methods || [],
        backupCodesRemaining: backupCodesCount || 0,
      };

      if (user.mfa_last_used) {
        result.lastUsed = new Date(user.mfa_last_used);
      }

      return result;
    } catch (error) {
      return {
        enabled: false,
        methods: [],
      };
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const response = await supabase.rpc('regenerate_backup_codes', {
        user_id: userId,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to regenerate backup codes'
      );
    }
  }

  /**
   * Check if user is locked out due to failed MFA attempts
   */
  private async checkLockout(userId: string): Promise<{
    isLockedOut: boolean;
    remainingTime: number;
    remainingAttempts: number;
  }> {
    try {
      const key = `${MFAService.MFA_ATTEMPTS_KEY}${userId}`;
      const attemptsData = localStorage.getItem(key);

      if (!attemptsData) {
        return {
          isLockedOut: false,
          remainingTime: 0,
          remainingAttempts: MFAService.MAX_ATTEMPTS,
        };
      }

      const { attempts, lockedUntil } = JSON.parse(attemptsData);
      const now = Date.now();

      if (lockedUntil && now < lockedUntil) {
        return {
          isLockedOut: true,
          remainingTime: lockedUntil - now,
          remainingAttempts: 0,
        };
      }

      return {
        isLockedOut: false,
        remainingTime: 0,
        remainingAttempts: Math.max(0, MFAService.MAX_ATTEMPTS - attempts),
      };
    } catch (error) {
      return {
        isLockedOut: false,
        remainingTime: 0,
        remainingAttempts: MFAService.MAX_ATTEMPTS,
      };
    }
  }

  /**
   * Record failed MFA attempt
   */
  private async recordFailedAttempt(userId: string): Promise<void> {
    try {
      const key = `${MFAService.MFA_ATTEMPTS_KEY}${userId}`;
      const attemptsData = localStorage.getItem(key);

      let attempts = 1;
      let lockedUntil: number | null = null;

      if (attemptsData) {
        const data = JSON.parse(attemptsData);
        attempts = data.attempts + 1;
      }

      if (attempts >= MFAService.MAX_ATTEMPTS) {
        lockedUntil = Date.now() + MFAService.LOCKOUT_DURATION;
      }

      localStorage.setItem(
        key,
        JSON.stringify({
          attempts,
          lockedUntil,
          lastAttempt: Date.now(),
        })
      );
    } catch (error) {
      console.error('Failed to record MFA attempt:', error);
    }
  }

  /**
   * Clear failed MFA attempts
   */
  private async clearFailedAttempts(userId: string): Promise<void> {
    try {
      const key = `${MFAService.MFA_ATTEMPTS_KEY}${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear MFA attempts:', error);
    }
  }
}

export const mfaService = new MFAService();

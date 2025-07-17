import { useState, useEffect, useContext, createContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { AuthState } from '../types/auth';

const AuthContext = createContext<
  | (AuthState & {
      signIn: (
        email: string,
        password: string
      ) => Promise<{ requiresMFA?: boolean; tempToken?: string | undefined }>;
      verifyMFAAndCompleteLogin: (
        email: string,
        password: string,
        mfaCode: string
      ) => Promise<void>;
      signOut: () => Promise<void>;
      refetchUser: () => Promise<void>;
    })
  | null
>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Query for current user
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: refetchUser,
    error,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authService.getCurrentUser.bind(authService),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: false,
    // Add a timeout to prevent hanging
    meta: {
      timeout: 10000, // 10 seconds
    },
  });

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get initial session
        const session = await authService.getSession();
        if (mounted) {
          setSession(session);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        setSession(null);
        setIsLoading(false);
      }
    }, 5000); // 5 seconds timeout (reduced from 10)

    initAuth();

    // Listen to auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async authState => {
      if (!mounted) return;

      setSession(authState.session); // Use the actual session object
      setIsLoading(false);

      if (authState.user) {
        // Refetch user data on sign in
        queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      } else {
        // Clear all cached data on sign out
        queryClient.clear();
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [queryClient, isLoading]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.signIn(email, password);
      if (result.error) {
        throw new Error(result.error);
      }

      // Return MFA requirement info if needed
      if (result.requiresMFA) {
        setIsLoading(false);
        return { requiresMFA: true, tempToken: result.tempToken };
      }

      // The auth state change listener will handle updating the session
      return { requiresMFA: false };
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const verifyMFAAndCompleteLogin = async (
    email: string,
    password: string,
    mfaCode: string
  ) => {
    setIsLoading(true);
    try {
      const result = await authService.verifyMFAAndCompleteLogin(
        email,
        password,
        mfaCode
      );
      if (result.error) {
        throw new Error(result.error);
      }
      // The auth state change listener will handle updating the session
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const result = await authService.signOut();
      if (result.error) {
        throw new Error(result.error);
      }
      // The auth state change listener will handle clearing the session
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const value = {
    user: user || null,
    session,
    isLoading: isLoading || (!!session && isUserLoading),
    isAuthenticated: !!session && !!user,
    error: error?.message || null,
    signIn,
    verifyMFAAndCompleteLogin,
    signOut,
    refetchUser: async () => {
      await refetchUser();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

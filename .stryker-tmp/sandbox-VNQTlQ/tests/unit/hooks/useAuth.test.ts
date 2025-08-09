// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, AuthProvider } from '../../../client/src/hooks/useAuth';
import React from 'react';

// Mock fetch globally
global.fetch = vi.fn();
const mockFetch = fetch as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(AuthProvider, { children })
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with no user when no token exists', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should login successfully with valid credentials', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'technician',
      warehouseId: 'warehouse-1',
      active: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'valid-jwt-token',
        user: mockUser,
        refreshToken: 'refresh-token',
        sessionId: 'session-id',
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'valid-jwt-token');
  });

  it('should handle login failure correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: 'Invalid credentials',
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await act(async () => {
      const loginResult = await result.current.login('test@example.com', 'wrongpassword');
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Invalid credentials');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should logout successfully', async () => {
    // First login
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'technician',
      warehouseId: 'warehouse-1',
      active: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'valid-jwt-token',
        user: mockUser,
        refreshToken: 'refresh-token',
        sessionId: 'session-id',
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // Then logout
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out successfully' }),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
  });

  it('should restore user from token on initialization', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'technician',
      warehouseId: 'warehouse-1',
      active: true,
    };

    localStorageMock.getItem.mockImplementation(key => {
      if (key === 'authToken') return 'existing-token';
      if (key === 'userId') return '1';
      if (key === 'warehouseId') return 'warehouse-1';
      return null;
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Check if fetch was called for authentication check
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/profiles/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer existing-token',
        }),
      })
    );
  });

  it('should handle invalid token gracefully', async () => {
    localStorageMock.getItem.mockImplementation(key => {
      if (key === 'authToken') return 'invalid-token';
      if (key === 'userId') return '1';
      if (key === 'warehouseId') return 'warehouse-1';
      return null;
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid token' }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(
      () => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      },
      { timeout: 3000 }
    );
  });

  it('should change password successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'technician',
    };

    // Login first
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'valid-jwt-token',
        user: mockUser,
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // Change password
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      const response = await result.current.changePassword('oldPassword', 'newPassword');
      expect(response.success).toBe(true);
    });
  });
});

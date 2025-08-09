// @ts-nocheck
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HealthDashboard } from '@/components/admin/HealthDashboard';
import * as healthService from '@/services/healthService';

// Mock the healthService
vi.mock('@/services/healthService', () => ({
  useHealthData: vi.fn(),
}));

const mockHealthData = {
  status: 'ok',
  timestamp: '2024-01-01T00:00:00.000Z',
  env: 'development',
  port: 5000,
  version: '1.0.0',
  uptime: 3600, // 1 hour in seconds
  memory: {
    rss: 104857600, // 100MB
    heapTotal: 67108864, // 64MB
    heapUsed: 33554432, // 32MB
    external: 8388608, // 8MB
    arrayBuffers: 1048576, // 1MB
  },
  websocket: {
    totalConnections: 10,
    activeConnections: 8,
    connectionsByWarehouse: {
      'warehouse-1': 5,
      'warehouse-2': 3,
    },
  },
  features: {
    auth: 'enabled',
    database: 'enabled',
    redis: 'disabled',
    email: 'enabled',
  },
  sha: 'abcd1234567890',
  buildId: 'build-12345',
  region: 'us-east-1',
};

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe('HealthDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays loading state initially', () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    useHealthDataMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderWithQueryClient(<HealthDashboard />);

    expect(screen.getByText('Loading health data...')).toBeInTheDocument();
  });

  it('displays error state when health data fails to load', () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    const mockRefetch = vi.fn();
    useHealthDataMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
      isFetching: false,
    });

    renderWithQueryClient(<HealthDashboard />);

    expect(screen.getByText('Failed to Load Health Data')).toBeInTheDocument();
    expect(screen.getByText('Unable to fetch system health information')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('displays health data when loaded successfully', async () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    useHealthDataMock.mockReturnValue({
      data: mockHealthData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderWithQueryClient(<HealthDashboard />);

    // Check main heading
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('Monitor system status and performance metrics')).toBeInTheDocument();

    // Check status cards
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('development environment')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // Active connections
    expect(screen.getByText('1.0.0')).toBeInTheDocument(); // Version
    expect(screen.getByText('Port 5000')).toBeInTheDocument();
  });

  it('displays memory usage correctly', () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    useHealthDataMock.mockReturnValue({
      data: mockHealthData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderWithQueryClient(<HealthDashboard />);

    // Memory usage should show 32MB/64MB (50%)
    expect(screen.getByText('Heap: 32MB / 64MB')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('RSS: 100MB')).toBeInTheDocument();
  });

  it('displays feature status correctly', () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    useHealthDataMock.mockReturnValue({
      data: mockHealthData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderWithQueryClient(<HealthDashboard />);

    expect(screen.getByText('Feature Status')).toBeInTheDocument();
    expect(screen.getByText('Auth')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Redis')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();

    // Check enabled/disabled status
    const enabledBadges = screen.getAllByText('Enabled');
    const disabledBadges = screen.getAllByText('Disabled');
    expect(enabledBadges).toHaveLength(3); // auth, database, email
    expect(disabledBadges).toHaveLength(1); // redis
  });

  it('displays deployment information when available', () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    useHealthDataMock.mockReturnValue({
      data: mockHealthData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderWithQueryClient(<HealthDashboard />);

    expect(screen.getByText('Deployment Information')).toBeInTheDocument();
    expect(screen.getByText('abcd1234')).toBeInTheDocument(); // SHA (first 8 chars)
    expect(screen.getByText('build-12345')).toBeInTheDocument(); // Build ID (first 12 chars)
    expect(screen.getByText('us-east-1')).toBeInTheDocument(); // Region
  });

  it('displays websocket connections by warehouse', () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    useHealthDataMock.mockReturnValue({
      data: mockHealthData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderWithQueryClient(<HealthDashboard />);

    expect(screen.getByText('Active Connections by Warehouse')).toBeInTheDocument();
    expect(screen.getByText('warehouse-1')).toBeInTheDocument();
    expect(screen.getByText('warehouse-2')).toBeInTheDocument();
    expect(screen.getByText('5 connections')).toBeInTheDocument();
    expect(screen.getByText('3 connections')).toBeInTheDocument();
  });

  it('handles unhealthy status correctly', () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    const unhealthyData = { ...mockHealthData, status: 'error' };
    useHealthDataMock.mockReturnValue({
      data: unhealthyData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderWithQueryClient(<HealthDashboard />);

    expect(screen.getByText('Unhealthy')).toBeInTheDocument();
  });

  it('calls refetch when refresh button is clicked', async () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    const mockRefetch = vi.fn();
    useHealthDataMock.mockReturnValue({
      data: mockHealthData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    });

    renderWithQueryClient(<HealthDashboard />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    refreshButton.click();

    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it('shows loading spinner when fetching', () => {
    const useHealthDataMock = vi.mocked(healthService.useHealthData);
    useHealthDataMock.mockReturnValue({
      data: mockHealthData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: true,
    });

    renderWithQueryClient(<HealthDashboard />);

    // The refresh button should be disabled and show spinning icon
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });
});

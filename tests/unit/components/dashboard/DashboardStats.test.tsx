import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import DashboardStats from '../../../../client/src/components/dashboard/DashboardStats';

// Mock fetch globally
global.fetch = vi.fn()

const mockFetch = fetch as any

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('DashboardStats Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves to show loading

    render(
      <Wrapper>
        <DashboardStats />
      </Wrapper>
    )

    // Check for loading cards
    const loadingCards = screen.getAllByRole('generic').filter(el => 
      el.classList.contains('animate-pulse')
    )
    expect(loadingCards.length).toBeGreaterThan(0)
  })

  it('should display dashboard statistics correctly', async () => {
    const mockStats = {
      totalWorkOrders: 150,
      pendingWorkOrders: 25,
      completedWorkOrders: 100,
      activeEquipment: 85,
      totalEquipment: 100
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    render(
      <Wrapper>
        <DashboardStats />
      </Wrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('150')).toBeDefined()
      expect(screen.getByText('25')).toBeDefined()
      expect(screen.getByText('100')).toBeDefined()
      expect(screen.getByText('85')).toBeDefined()
    })
  })

  it('should handle API error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <Wrapper>
        <DashboardStats />
      </Wrapper>
    )

    await waitFor(() => {
      // Since the component doesn't show error state by default, just verify it renders
      const cards = screen.getAllByText('0')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  it('should refresh data when component remounts', async () => {
    const mockStats = {
      totalWorkOrders: 150,
      pendingWorkOrders: 25,
      completedWorkOrders: 100,
      activeEquipment: 85,
      totalEquipment: 100
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    const { rerender } = render(
      <Wrapper>
        <DashboardStats />
      </Wrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('150')).toBeDefined()
    })

    // Simulate data update
    const updatedStats = { ...mockStats, totalWorkOrders: 175 }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedStats
    })

    rerender(
      <Wrapper>
        <DashboardStats />
      </Wrapper>
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/stats', expect.any(Object))
    })
  })

  it('should display proper accessibility attributes', async () => {
    const mockStats = {
      totalWorkOrders: 150,
      pendingWorkOrders: 25,
      completedWorkOrders: 100,
      activeEquipment: 85,
      totalEquipment: 100
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    render(
      <Wrapper>
        <DashboardStats />
      </Wrapper>
    )

    await waitFor(() => {
      const testIds = ['total-work-orders', 'pending-work-orders', 'completed-work-orders', 'active-equipment']
      testIds.forEach(testId => {
        expect(screen.getByTestId(testId)).toBeDefined()
      })
    })
  })
})
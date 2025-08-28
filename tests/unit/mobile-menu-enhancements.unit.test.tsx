import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import MobileMenu from '../../client/src/components/layout/MobileMenu';
import { useAuth } from '../../client/src/hooks/useAuth';

// Mock the hooks
vi.mock('../../client/src/hooks/useAuth');
vi.mock('wouter', () => ({
  Link: ({ children, href, onClick, className, 'data-testid': testId, ...props }: any) => (
    <a href={href} onClick={onClick} className={className} data-testid={testId} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ['/dashboard'],
}));

const mockUseAuth = vi.mocked(useAuth);

describe('MobileMenu Component Enhanced UI', () => {
  const mockUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'supervisor',
  };

  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    } as any);

    vi.clearAllMocks();
  });

  test('renders all required data-testid attributes when open', () => {
    render(<MobileMenu {...mockProps} />);

    // Check main structure
    expect(screen.getByTestId('mobile-menu-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-header')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-logo')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-title')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-close-button')).toBeInTheDocument();

    // Check user profile section
    expect(screen.getByTestId('mobile-menu-user-profile')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-user-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-user-name')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-user-role')).toBeInTheDocument();

    // Check navigation
    expect(screen.getByTestId('mobile-menu-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-work-orders')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-equipment')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-inventory')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-preventive-maintenance')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-vendors')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-reports')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-settings')).toBeInTheDocument();

    // Check footer
    expect(screen.getByTestId('mobile-menu-footer')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<MobileMenu {...mockProps} isOpen={false} />);

    expect(screen.queryByTestId('mobile-menu-overlay')).not.toBeInTheDocument();
  });

  test('displays user information correctly', () => {
    render(<MobileMenu {...mockProps} />);

    const userName = screen.getByTestId('mobile-menu-user-name');
    const userRole = screen.getByTestId('mobile-menu-user-role');
    const userAvatar = screen.getByTestId('mobile-menu-user-avatar');

    expect(userName).toHaveTextContent('John Doe');
    expect(userRole).toHaveTextContent('supervisor');
    expect(userAvatar).toHaveTextContent('JD');
  });

  test('displays active navigation indicator for current page', () => {
    render(<MobileMenu {...mockProps} />);

    // Dashboard should be active since useLocation returns '/dashboard'
    const dashboardLink = screen.getByTestId('mobile-nav-dashboard');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');

    // Check for active indicator
    expect(screen.getByTestId('mobile-nav-active-indicator')).toBeInTheDocument();
  });

  test('close button calls onClose when clicked', () => {
    render(<MobileMenu {...mockProps} />);

    const closeButton = screen.getByTestId('mobile-menu-close-button');
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('navigation items call onClose when clicked', () => {
    render(<MobileMenu {...mockProps} />);

    const dashboardLink = screen.getByTestId('mobile-nav-dashboard');
    fireEvent.click(dashboardLink);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('settings link calls onClose when clicked', () => {
    render(<MobileMenu {...mockProps} />);

    const settingsLink = screen.getByTestId('mobile-nav-settings');
    fireEvent.click(settingsLink);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('has proper accessibility attributes', () => {
    render(<MobileMenu {...mockProps} />);

    // Check close button has aria-label
    const closeButton = screen.getByTestId('mobile-menu-close-button');
    expect(closeButton).toHaveAttribute('aria-label', 'Close mobile menu');

    // Check that SVG icons have aria-hidden for accessibility
    const container = screen.getByTestId('mobile-menu-sidebar');
    const svgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBeGreaterThan(0);
  });

  test('handles user with no role gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: undefined },
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(<MobileMenu {...mockProps} />);

    const userRole = screen.getByTestId('mobile-menu-user-role');
    expect(userRole).toHaveTextContent('');
  });

  test('handles user with underscore role correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'facility_manager' },
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(<MobileMenu {...mockProps} />);

    const userRole = screen.getByTestId('mobile-menu-user-role');
    expect(userRole).toHaveTextContent('facility manager');
  });
});

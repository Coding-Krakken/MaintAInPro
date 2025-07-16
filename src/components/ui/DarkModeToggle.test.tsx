import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme, DarkModeToggle } from './DarkModeToggle';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('provides default light theme', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const TestComponent = () => {
      const { theme } = useTheme();
      return <div>{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('light')).toBeInTheDocument();
  });

  it('loads theme from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('dark');

    const TestComponent = () => {
      const { theme } = useTheme();
      return <div>{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('dark')).toBeInTheDocument();
  });

  it('toggles theme and saves to localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('light');

    const TestComponent = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <span>{theme}</span>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('light')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Toggle'));

    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('applies theme class to document', () => {
    mockLocalStorage.getItem.mockReturnValue('dark');

    const TestComponent = () => {
      const { theme } = useTheme();
      return <div>{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

describe('DarkModeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('light');
  });

  it('renders icon variant correctly', () => {
    render(
      <ThemeProvider>
        <DarkModeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('renders button variant correctly', () => {
    render(
      <ThemeProvider>
        <DarkModeToggle variant='button' />
      </ThemeProvider>
    );

    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('toggles theme when clicked', () => {
    const TestComponent = () => {
      const { theme } = useTheme();
      return (
        <div>
          <span data-testid='theme'>{theme}</span>
          <DarkModeToggle />
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('shows correct icon for each theme', () => {
    const TestComponent = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid='theme'>{theme}</span>
          <DarkModeToggle />
          <button onClick={toggleTheme} data-testid='manual-toggle'>
            Manual Toggle
          </button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Light mode should show moon icon
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(
      screen.getByRole('button', { name: /switch to dark mode/i })
    ).toBeInTheDocument();

    // Switch to dark mode
    fireEvent.click(screen.getByTestId('manual-toggle'));

    // Dark mode should show sun icon
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(
      screen.getByRole('button', { name: /switch to light mode/i })
    ).toBeInTheDocument();
  });
});

describe('useTheme', () => {
  it('throws error when used outside ThemeProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponent = () => {
      useTheme();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );

    consoleSpy.mockRestore();
  });
});

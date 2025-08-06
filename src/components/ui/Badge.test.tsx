import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge Component', () => {
  beforeEach(() => {
    // Reset any DOM state before each test
    document.body.innerHTML = '';
  });

  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<Badge>Test Badge</Badge>);

      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders with default variant when no variant specified', () => {
      render(<Badge>Default Badge</Badge>);

      const badge = screen.getByText('Default Badge');
      expect(badge).toHaveClass(
        'bg-blue-100',
        'text-blue-800',
        'border-blue-200'
      );
    });

    it('applies base styling classes', () => {
      render(<Badge>Styled Badge</Badge>);

      const badge = screen.getByText('Styled Badge');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold',
        'transition-colors',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500'
      );
    });

    it('renders as div element', () => {
      render(<Badge>Div Badge</Badge>);

      const badge = screen.getByText('Div Badge');
      expect(badge.tagName).toBe('DIV');
    });
  });

  describe('Variant Styling', () => {
    it('applies default variant classes', () => {
      render(<Badge variant='default'>Default Variant</Badge>);

      const badge = screen.getByText('Default Variant');
      expect(badge).toHaveClass(
        'bg-blue-100',
        'text-blue-800',
        'border-blue-200'
      );
    });

    it('applies secondary variant classes', () => {
      render(<Badge variant='secondary'>Secondary Variant</Badge>);

      const badge = screen.getByText('Secondary Variant');
      expect(badge).toHaveClass(
        'bg-gray-100',
        'text-gray-800',
        'border-gray-200'
      );
    });

    it('applies destructive variant classes', () => {
      render(<Badge variant='destructive'>Destructive Variant</Badge>);

      const badge = screen.getByText('Destructive Variant');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });

    it('applies outline variant classes', () => {
      render(<Badge variant='outline'>Outline Variant</Badge>);

      const badge = screen.getByText('Outline Variant');
      expect(badge).toHaveClass(
        'border-gray-300',
        'text-gray-700',
        'bg-transparent'
      );
    });

    it('applies success variant classes', () => {
      render(<Badge variant='success'>Success Variant</Badge>);

      const badge = screen.getByText('Success Variant');
      expect(badge).toHaveClass(
        'bg-green-100',
        'text-green-800',
        'border-green-200'
      );
    });

    it('applies warning variant classes', () => {
      render(<Badge variant='warning'>Warning Variant</Badge>);

      const badge = screen.getByText('Warning Variant');
      expect(badge).toHaveClass(
        'bg-yellow-100',
        'text-yellow-800',
        'border-yellow-200'
      );
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className alongside variant classes', () => {
      render(
        <Badge variant='success' className='custom-badge-class'>
          Custom Badge
        </Badge>
      );

      const badge = screen.getByText('Custom Badge');
      expect(badge).toHaveClass('custom-badge-class');
      expect(badge).toHaveClass(
        'bg-green-100',
        'text-green-800',
        'border-green-200'
      );
    });

    it('allows className to override default styles', () => {
      render(
        <Badge className='bg-purple-500 text-white'>Override Badge</Badge>
      );

      const badge = screen.getByText('Override Badge');
      expect(badge).toHaveClass('bg-purple-500', 'text-white');
    });
  });

  describe('Props and Attributes', () => {
    it('forwards additional props to the div element', () => {
      render(
        <Badge data-testid='test-badge' role='status' aria-label='Status badge'>
          Props Badge
        </Badge>
      );

      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('role', 'status');
      expect(badge).toHaveAttribute('aria-label', 'Status badge');
    });

    it('handles onClick events', () => {
      const handleClick = vi.fn();
      render(<Badge onClick={handleClick}>Clickable Badge</Badge>);

      const badge = screen.getByText('Clickable Badge');
      badge.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports id attribute', () => {
      render(<Badge id='unique-badge'>ID Badge</Badge>);

      const badge = screen.getByText('ID Badge');
      expect(badge).toHaveAttribute('id', 'unique-badge');
    });

    it('supports title attribute', () => {
      render(<Badge title='Badge tooltip'>Tooltip Badge</Badge>);

      const badge = screen.getByText('Tooltip Badge');
      expect(badge).toHaveAttribute('title', 'Badge tooltip');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Badge ref={ref}>Ref Badge</Badge>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toBe('Ref Badge');
    });

    it('allows ref manipulation', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Badge ref={ref}>Manipulate Badge</Badge>);

      if (ref.current) {
        ref.current.style.opacity = '0.5';
        expect(ref.current.style.opacity).toBe('0.5');
      }
    });
  });

  describe('Content Types', () => {
    it('renders text content', () => {
      render(<Badge>Simple text</Badge>);

      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('renders numeric content', () => {
      render(<Badge>{42}</Badge>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders complex content with elements', () => {
      render(
        <Badge>
          <span>Status:</span> <strong>Active</strong>
        </Badge>
      );

      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders empty badge', () => {
      const { container } = render(<Badge />);

      const badge = container.querySelector('div');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe('');
    });

    it('handles zero as content', () => {
      render(<Badge>{0}</Badge>);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label for screen readers', () => {
      render(
        <Badge variant='success' aria-label='Success status'>
          ✓
        </Badge>
      );

      const badge = screen.getByLabelText('Success status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('✓');
    });

    it('supports role attribute for semantic meaning', () => {
      render(
        <Badge role='status' variant='warning'>
          Warning
        </Badge>
      );

      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100');
    });

    it('has proper focus ring styling', () => {
      render(<Badge>Focusable Badge</Badge>);

      const badge = screen.getByText('Focusable Badge');
      expect(badge).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500'
      );
    });
  });

  describe('Display Name', () => {
    it('has correct display name for debugging', () => {
      expect(Badge.displayName).toBe('Badge');
    });
  });

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      render(<Badge>{null}</Badge>);

      const badge = document.querySelector('div');
      expect(badge).toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      render(<Badge>{undefined}</Badge>);

      const badge = document.querySelector('div');
      expect(badge).toBeInTheDocument();
    });

    it('handles false children gracefully', () => {
      render(<Badge>{false}</Badge>);

      const badge = document.querySelector('div');
      expect(badge).toBeInTheDocument();
    });

    it('combines multiple classes correctly', () => {
      render(
        <Badge variant='destructive' className='extra-class another-class'>
          Multi-class Badge
        </Badge>
      );

      const badge = screen.getByText('Multi-class Badge');
      expect(badge).toHaveClass('bg-red-100', 'extra-class', 'another-class');
    });
  });
});

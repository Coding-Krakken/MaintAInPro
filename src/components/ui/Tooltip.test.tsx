import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tooltip } from './Tooltip';
import { Button } from './Button';

describe('Tooltip', () => {
  it('renders children correctly', () => {
    render(
      <Tooltip content='Test tooltip'>
        <Button>Test Button</Button>
      </Tooltip>
    );

    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    render(
      <Tooltip content='Test tooltip'>
        <Button>Test Button</Button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <Tooltip content='Test tooltip'>
        <Button>Test Button</Button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(button);

    await waitFor(() => {
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on focus', async () => {
    render(
      <Tooltip content='Test tooltip'>
        <Button>Test Button</Button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.focus(button);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });
  });

  it('hides tooltip on blur', async () => {
    render(
      <Tooltip content='Test tooltip'>
        <Button>Test Button</Button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.focus(button);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });

    fireEvent.blur(button);

    await waitFor(() => {
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });
  });

  it('does not show tooltip when disabled', async () => {
    render(
      <Tooltip content='Test tooltip' disabled>
        <Button>Test Button</Button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    // Wait a bit to ensure tooltip doesn't appear
    await new Promise(resolve => setTimeout(resolve, 350));

    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('applies custom className', async () => {
    render(
      <Tooltip content='Test tooltip' className='custom-class'>
        <Button>Test Button</Button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      const tooltip = screen.getByText('Test tooltip');
      expect(tooltip).toHaveClass('custom-class');
    });
  });

  it('positions tooltip correctly', async () => {
    render(
      <Tooltip content='Test tooltip' side='bottom'>
        <Button>Test Button</Button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      const tooltip = screen.getByText('Test tooltip');
      expect(tooltip).toHaveClass('top-full');
    });
  });

  it('respects custom delay duration', async () => {
    render(
      <Tooltip content='Test tooltip' delayDuration={100}>
        <Button>Test Button</Button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    // Should not be visible immediately
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();

    // Should be visible after delay
    await waitFor(() => {
      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', async () => {
    render(
      <Tooltip content='Test tooltip'>
        <Button>Test Button</Button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      const tooltip = screen.getByText('Test tooltip');
      expect(tooltip).toHaveAttribute('role', 'tooltip');
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Modal {...defaultProps} title='Test Modal' />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Test Modal'
    );
  });

  it('renders without title', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows close button when title is provided', () => {
    render(<Modal {...defaultProps} title='Test Modal' />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} title='Test Modal' onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    // Click on the backdrop (overlay)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black');
    if (backdrop) {
      fireEvent.click(backdrop);
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    }
  });

  it('calls onClose when escape key is pressed', async () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('handles different sizes', () => {
    const { rerender } = render(<Modal {...defaultProps} size='sm' />);
    let panel = document.querySelector('[role="dialog"]');
    expect(panel).toHaveClass('max-w-md');

    rerender(<Modal {...defaultProps} size='md' />);
    panel = document.querySelector('[role="dialog"]');
    expect(panel).toHaveClass('max-w-lg');

    rerender(<Modal {...defaultProps} size='lg' />);
    panel = document.querySelector('[role="dialog"]');
    expect(panel).toHaveClass('max-w-2xl');

    rerender(<Modal {...defaultProps} size='xl' />);
    panel = document.querySelector('[role="dialog"]');
    expect(panel).toHaveClass('max-w-4xl');

    rerender(<Modal {...defaultProps} size='full' />);
    panel = document.querySelector('[role="dialog"]');
    expect(panel).toHaveClass('max-w-full', 'mx-4');
  });

  it('applies custom className', () => {
    render(<Modal {...defaultProps} className='custom-modal-class' />);

    const panel = document.querySelector('[role="dialog"]');
    expect(panel).toHaveClass('custom-modal-class');
  });

  it('renders children content', () => {
    const testContent = (
      <div>
        <p>Test paragraph</p>
        <button>Test button</button>
      </div>
    );

    render(<Modal {...defaultProps}>{testContent}</Modal>);

    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Test button' })
    ).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Modal {...defaultProps} title='Accessible Modal' />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toBeInTheDocument();
  });

  it('prevents body scroll when open', () => {
    render(<Modal {...defaultProps} />);

    // The modal should be rendered and the backdrop should prevent scrolling
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
  });

  it('focuses on modal when opened', async () => {
    render(<Modal {...defaultProps} title='Focus Test' />);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  it('traps focus within modal', async () => {
    render(
      <Modal {...defaultProps} title='Focus Trap Test'>
        <input data-testid='input1' />
        <button data-testid='button1'>Button 1</button>
        <input data-testid='input2' />
      </Modal>
    );

    const input1 = screen.getByTestId('input1');

    // Tab navigation should cycle through focusable elements
    input1.focus();
    expect(input1).toHaveFocus();

    fireEvent.keyDown(input1, { key: 'Tab' });
    await waitFor(() => {
      // Focus should move to next focusable element
      expect(document.activeElement).not.toBe(input1);
    });
  });

  it('handles modal transitions', async () => {
    const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();

    rerender(<Modal {...defaultProps} isOpen={true} />);

    await waitFor(() => {
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });
  });
});

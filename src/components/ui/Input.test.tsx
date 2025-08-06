import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input data-testid='input' />);
    const input = screen.getByTestId('input');

    expect(input).toBeInTheDocument();
    expect(input).toHaveClass(
      'flex',
      'w-full',
      'border',
      'rounded-md',
      'px-3',
      'py-2',
      'h-10'
    );
  });

  it('handles different variants', () => {
    const { rerender } = render(
      <Input data-testid='input' variant='default' />
    );
    expect(screen.getByTestId('input')).toHaveClass(
      'rounded-md',
      'px-3',
      'py-2'
    );

    rerender(<Input data-testid='input' variant='ghost' />);
    expect(screen.getByTestId('input')).toHaveClass(
      'border-0',
      'bg-transparent'
    );
  });

  it('handles different sizes', () => {
    const { rerender } = render(<Input data-testid='input' size='default' />);
    expect(screen.getByTestId('input')).toHaveClass('h-10');

    rerender(<Input data-testid='input' size='sm' />);
    expect(screen.getByTestId('input')).toHaveClass('h-8', 'px-2');

    rerender(<Input data-testid='input' size='lg' />);
    expect(screen.getByTestId('input')).toHaveClass('h-12', 'px-4');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('handles input events', () => {
    const handleChange = vi.fn();
    render(<Input data-testid='input' onChange={handleChange} />);

    const input = screen.getByTestId('input');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).value).toBe('test value');
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input data-testid='input' type='text' />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');

    rerender(<Input data-testid='input' type='email' />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input data-testid='input' type='password' />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
  });

  it('handles placeholder text', () => {
    render(<Input data-testid='input' placeholder='Enter text here' />);

    expect(screen.getByTestId('input')).toHaveAttribute(
      'placeholder',
      'Enter text here'
    );
  });

  it('handles disabled state', () => {
    render(<Input data-testid='input' disabled />);

    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass(
      'disabled:cursor-not-allowed',
      'disabled:opacity-50'
    );
  });

  it('handles required attribute', () => {
    render(<Input data-testid='input' required />);

    expect(screen.getByTestId('input')).toBeRequired();
  });

  it('applies custom className', () => {
    render(<Input data-testid='input' className='custom-class' />);

    expect(screen.getByTestId('input')).toHaveClass('custom-class');
  });

  it('handles value prop', () => {
    render(<Input data-testid='input' value='controlled value' readOnly />);

    expect((screen.getByTestId('input') as HTMLInputElement).value).toBe(
      'controlled value'
    );
  });

  it('handles aria attributes for accessibility', () => {
    render(
      <Input
        data-testid='input'
        aria-label='Test input'
        aria-describedby='input-description'
        aria-invalid='true'
      />
    );

    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('aria-label', 'Test input');
    expect(input).toHaveAttribute('aria-describedby', 'input-description');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(
      <Input data-testid='input' onFocus={handleFocus} onBlur={handleBlur} />
    );

    const input = screen.getByTestId('input');

    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard events', () => {
    const handleKeyDown = vi.fn();

    render(<Input data-testid='input' onKeyDown={handleKeyDown} />);

    const input = screen.getByTestId('input');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });
});

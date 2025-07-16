import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

describe('Select', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ];

  it('renders correctly', () => {
    render(<Select options={mockOptions} />);
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Select options={mockOptions} label='Test Label' />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Select options={mockOptions} placeholder='Select an option' />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select options={mockOptions} />);
    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('shows error message when error prop is provided', () => {
    const errorMessage = 'This field is required';
    render(<Select options={mockOptions} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows helper text when provided', () => {
    const helperText = 'Choose one option';
    render(<Select options={mockOptions} helperText={helperText} />);
    expect(screen.getByText(helperText)).toBeInTheDocument();
  });

  it('calls onChange when selection changes', () => {
    const mockOnChange = vi.fn();
    render(<Select options={mockOptions} onChange={mockOnChange} />);

    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'option1' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('has correct accessibility attributes', () => {
    render(<Select options={mockOptions} label='Test Label' />);
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Select options={mockOptions} className='custom-class' />);
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveClass('custom-class');
  });

  it('renders disabled options correctly', () => {
    render(<Select options={mockOptions} />);
    const disabledOption = screen.getByText('Option 3');
    expect(disabledOption).toBeDisabled();
  });
});

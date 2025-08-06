import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField, FormMessage, FormSubmit } from './Form';

describe('Form Components - Basic Tests', () => {
  beforeEach(() => {
    // Reset any DOM state before each test
    document.body.innerHTML = '';
  });

  describe('FormField Component', () => {
    it('renders with label when provided', () => {
      render(
        <FormField name='test' label='Test Label'>
          <input name='test' />
        </FormField>
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('renders without label when not provided', () => {
      render(
        <FormField name='test'>
          <input name='test' />
        </FormField>
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
    });

    it('displays description when provided', () => {
      render(
        <FormField name='test' description='This is a description'>
          <input name='test' />
        </FormField>
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
      expect(screen.getByText('This is a description')).toHaveClass(
        'text-sm',
        'text-secondary-500'
      );
    });

    it('displays error message when provided', () => {
      render(
        <FormField name='test' error='This field is required'>
          <input name='test' />
        </FormField>
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByText('This field is required')).toHaveClass(
        'text-sm',
        'text-error-600'
      );
    });
  });

  describe('FormMessage Component', () => {
    it('renders with default error variant', () => {
      render(<FormMessage>Error message</FormMessage>);

      const message = screen.getByText('Error message');
      expect(message).toBeInTheDocument();
      expect(message).toHaveClass('text-sm', 'text-error-600');
    });

    it('renders with success variant', () => {
      render(<FormMessage variant='success'>Success message</FormMessage>);

      const message = screen.getByText('Success message');
      expect(message).toHaveClass('text-sm', 'text-success-600');
    });

    it('renders with warning variant', () => {
      render(<FormMessage variant='warning'>Warning message</FormMessage>);

      const message = screen.getByText('Warning message');
      expect(message).toHaveClass('text-sm', 'text-warning-600');
    });
  });

  describe('FormSubmit Component', () => {
    it('renders submit button with correct attributes', () => {
      render(<FormSubmit>Submit Form</FormSubmit>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveTextContent('Submit Form');
    });

    it('applies default styling classes', () => {
      render(<FormSubmit>Submit</FormSubmit>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'w-full',
        'flex',
        'justify-center',
        'items-center'
      );
    });

    it('disables when disabled prop is true', () => {
      render(<FormSubmit disabled>Submit</FormSubmit>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('shows loading state correctly', () => {
      render(<FormSubmit isLoading>Submit</FormSubmit>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });
});

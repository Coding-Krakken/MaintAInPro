import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { Form, FormField, FormMessage, FormSubmit } from './Form';

// Mock schema for testing
const testSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

type TestFormData = z.infer<typeof testSchema>;

describe('Form Components', () => {
  const mockOnSubmit = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    // Reset any DOM state before each test
    document.body.innerHTML = '';
  });

  const TestForm = ({
    defaultValues,
    onSubmit = mockOnSubmit,
  }: {
    defaultValues?: Partial<TestFormData>;
    onSubmit?: (data: TestFormData) => void;
  }) => (
    <Form
      schema={testSchema}
      onSubmit={onSubmit}
      defaultValues={defaultValues || {}}
    >
      <FormField name='name' label='Name'>
        <input name='name' placeholder='Enter name' />
      </FormField>
      <FormField name='email' label='Email'>
        <input name='email' type='email' placeholder='Enter email' />
      </FormField>
      <FormField name='password' label='Password'>
        <input name='password' type='password' placeholder='Enter password' />
      </FormField>
      <FormSubmit>Submit</FormSubmit>
    </Form>
  );

  describe('Form Component', () => {
    it('renders form with proper structure', () => {
      render(<TestForm />);

      const form = screen.getByRole('form') || document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveClass('space-y-6');
    });

    it('applies custom className', () => {
      render(
        <Form
          schema={testSchema}
          onSubmit={mockOnSubmit}
          className='custom-form'
        >
          <div>Test content</div>
        </Form>
      );

      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-6', 'custom-form');
    });

    it('sets default values correctly', () => {
      const defaultValues = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      render(<TestForm defaultValues={defaultValues} />);

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('password123')).toBeInTheDocument();
    });

    it('calls onSubmit with valid data', async () => {
      render(<TestForm />);

      await user.type(screen.getByPlaceholderText('Enter name'), 'John Doe');
      await user.type(
        screen.getByPlaceholderText('Enter email'),
        'john@example.com'
      );
      await user.type(
        screen.getByPlaceholderText('Enter password'),
        'password123'
      );

      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });
      });
    });

    it('does not call onSubmit with invalid data', async () => {
      render(<TestForm />);

      // Submit empty form (should fail validation)
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('handles form submission with validation errors', async () => {
      render(<TestForm />);

      // Enter invalid email
      await user.type(
        screen.getByPlaceholderText('Enter email'),
        'invalid-email'
      );
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
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

    it('applies custom className', () => {
      const { container } = render(
        <FormField name='test' className='custom-field'>
          <input name='test' />
        </FormField>
      );

      const fieldContainer = container.firstChild as HTMLElement;
      expect(fieldContainer).toHaveClass('space-y-2', 'custom-field');
    });

    it('associates label with input using htmlFor', () => {
      render(
        <FormField name='test-input' label='Test Label'>
          <input name='test-input' id='test-input' />
        </FormField>
      );

      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('renders all elements in correct order', () => {
      const { container } = render(
        <FormField
          name='test'
          label='Test Label'
          description='Test description'
          error='Test error'
        >
          <input name='test' placeholder='Test input' />
        </FormField>
      );

      const fieldDiv = container.firstChild as HTMLElement;
      const children = Array.from(fieldDiv.children);

      expect(children[0]?.textContent).toBe('Test Label');
      expect(children[1]).toContain(screen.getByPlaceholderText('Test input'));
      expect(children[2]?.textContent).toBe('Test description');
      expect(children[3]?.textContent).toBe('Test error');
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

    it('renders with error variant explicitly', () => {
      render(<FormMessage variant='error'>Error message</FormMessage>);

      const message = screen.getByText('Error message');
      expect(message).toHaveClass('text-sm', 'text-error-600');
    });

    it('handles complex children content', () => {
      render(
        <FormMessage variant='success'>
          <span>Success!</span> Operation completed.
        </FormMessage>
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Operation completed.')).toBeInTheDocument();
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
        'items-center',
        'px-4',
        'py-2',
        'border',
        'border-transparent',
        'rounded-md',
        'shadow-sm',
        'text-sm',
        'font-medium',
        'text-white',
        'bg-primary-600',
        'hover:bg-primary-700'
      );
    });

    it('applies custom className', () => {
      render(<FormSubmit className='custom-submit'>Submit</FormSubmit>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-submit');
    });

    it('disables when disabled prop is true', () => {
      render(<FormSubmit disabled>Submit</FormSubmit>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        'disabled:opacity-50',
        'disabled:cursor-not-allowed'
      );
    });

    it('shows loading state correctly', () => {
      render(<FormSubmit isLoading>Submit</FormSubmit>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();

      // Check for loading spinner SVG
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.parentElement).toHaveClass('animate-spin');
    });

    it('shows normal content when not loading', () => {
      render(<FormSubmit>Submit Form</FormSubmit>);

      expect(screen.getByText('Submit Form')).toBeInTheDocument();
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });

    it('handles click events when enabled', async () => {
      const handleClick = vi.fn();
      render(
        <form onSubmit={handleClick}>
          <FormSubmit>Submit</FormSubmit>
        </form>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalled();
    });

    it('does not handle click events when disabled', async () => {
      const handleClick = vi.fn();
      render(
        <form onSubmit={handleClick}>
          <FormSubmit disabled>Submit</FormSubmit>
        </form>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('works with complete form workflow', async () => {
      render(<TestForm />);

      // Fill out form
      await user.type(screen.getByPlaceholderText('Enter name'), 'Jane Doe');
      await user.type(
        screen.getByPlaceholderText('Enter email'),
        'jane@example.com'
      );
      await user.type(
        screen.getByPlaceholderText('Enter password'),
        'password123'
      );

      // Submit form
      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      // Verify submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
        });
      });
    });

    it('handles validation errors properly', async () => {
      render(<TestForm />);

      // Enter invalid data
      await user.type(screen.getByPlaceholderText('Enter email'), 'invalid');
      await user.type(screen.getByPlaceholderText('Enter password'), '123'); // Too short

      // Submit form
      await user.click(screen.getByText('Submit'));

      // Should not call onSubmit due to validation errors
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('preserves form state during interactions', async () => {
      render(<TestForm />);

      const nameInput = screen.getByPlaceholderText('Enter name');
      const emailInput = screen.getByPlaceholderText('Enter email');

      // Type in fields
      await user.type(nameInput, 'John');
      await user.type(emailInput, 'john@test.com');

      // Verify values are preserved
      expect(nameInput).toHaveValue('John');
      expect(emailInput).toHaveValue('john@test.com');

      // Try to submit (will fail due to missing password)
      await user.click(screen.getByText('Submit'));

      // Values should still be preserved
      expect(nameInput).toHaveValue('John');
      expect(emailInput).toHaveValue('john@test.com');
    });

    it('works with loading state during submission', async () => {
      const slowSubmit = vi.fn(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <Form schema={testSchema} onSubmit={slowSubmit}>
          <FormSubmit isLoading>Submit</FormSubmit>
        </Form>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });
});

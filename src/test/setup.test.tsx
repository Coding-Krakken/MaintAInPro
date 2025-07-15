import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple test component
const TestComponent = () => <div>Hello World</div>;

describe('Testing Setup', () => {
  it('should render test component', () => {
    render(<TestComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should perform basic assertions', () => {
    expect(2 + 2).toBe(4);
    expect('hello').toMatch(/hello/);
    expect([1, 2, 3]).toContain(2);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    await expect(promise).resolves.toBe('test');
  });
});

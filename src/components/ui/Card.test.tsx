import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';

describe('Card', () => {
  it('renders with default props', () => {
    render(<Card data-testid='card'>Card content</Card>);

    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass(
      'bg-white',
      'rounded-lg',
      'border',
      'border-gray-200',
      'p-4',
      'shadow-sm'
    );
    expect(card).toHaveTextContent('Card content');
  });

  it('handles different padding sizes', () => {
    const { rerender } = render(
      <Card data-testid='card' padding='none'>
        Content
      </Card>
    );
    expect(screen.getByTestId('card')).not.toHaveClass('p-3', 'p-4', 'p-6');

    rerender(
      <Card data-testid='card' padding='sm'>
        Content
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-3');

    rerender(
      <Card data-testid='card' padding='md'>
        Content
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-4');

    rerender(
      <Card data-testid='card' padding='lg'>
        Content
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-6');
  });

  it('handles different shadow sizes', () => {
    const { rerender } = render(
      <Card data-testid='card' shadow='none'>
        Content
      </Card>
    );
    expect(screen.getByTestId('card')).not.toHaveClass(
      'shadow-sm',
      'shadow-md',
      'shadow-lg'
    );

    rerender(
      <Card data-testid='card' shadow='sm'>
        Content
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('shadow-sm');

    rerender(
      <Card data-testid='card' shadow='md'>
        Content
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('shadow-md');

    rerender(
      <Card data-testid='card' shadow='lg'>
        Content
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('shadow-lg');
  });

  it('applies custom className', () => {
    render(
      <Card data-testid='card' className='custom-card-class'>
        Content
      </Card>
    );

    expect(screen.getByTestId('card')).toHaveClass('custom-card-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Card ref={ref}>Content</Card>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes through HTML attributes', () => {
    render(
      <Card data-testid='card' role='article' aria-label='Test card'>
        Content
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('role', 'article');
    expect(card).toHaveAttribute('aria-label', 'Test card');
  });
});

describe('CardHeader', () => {
  it('renders with correct structure', () => {
    render(<CardHeader data-testid='card-header'>Header content</CardHeader>);

    const header = screen.getByTestId('card-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'pb-4');
    expect(header).toHaveTextContent('Header content');
  });

  it('applies custom className', () => {
    render(
      <CardHeader data-testid='card-header' className='custom-header'>
        Content
      </CardHeader>
    );

    expect(screen.getByTestId('card-header')).toHaveClass('custom-header');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<CardHeader ref={ref}>Content</CardHeader>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardTitle', () => {
  it('renders as h3 with correct styles', () => {
    render(<CardTitle data-testid='card-title'>Test Title</CardTitle>);

    const title = screen.getByTestId('card-title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass(
      'text-lg',
      'font-semibold',
      'leading-none',
      'tracking-tight'
    );
    expect(title).toHaveTextContent('Test Title');
  });

  it('applies custom className', () => {
    render(
      <CardTitle data-testid='card-title' className='custom-title'>
        Title
      </CardTitle>
    );

    expect(screen.getByTestId('card-title')).toHaveClass('custom-title');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<CardTitle ref={ref}>Title</CardTitle>);

    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('CardDescription', () => {
  it('renders as paragraph with correct styles', () => {
    render(
      <CardDescription data-testid='card-description'>
        Test description
      </CardDescription>
    );

    const description = screen.getByTestId('card-description');
    expect(description).toBeInTheDocument();
    expect(description.tagName).toBe('P');
    expect(description).toHaveClass('text-sm', 'text-gray-500');
    expect(description).toHaveTextContent('Test description');
  });

  it('applies custom className', () => {
    render(
      <CardDescription data-testid='card-description' className='custom-desc'>
        Description
      </CardDescription>
    );

    expect(screen.getByTestId('card-description')).toHaveClass('custom-desc');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<CardDescription ref={ref}>Description</CardDescription>);

    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe('CardContent', () => {
  it('renders with correct styles', () => {
    render(<CardContent data-testid='card-content'>Content text</CardContent>);

    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('pt-0');
    expect(content).toHaveTextContent('Content text');
  });

  it('applies custom className', () => {
    render(
      <CardContent data-testid='card-content' className='custom-content'>
        Content
      </CardContent>
    );

    expect(screen.getByTestId('card-content')).toHaveClass('custom-content');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<CardContent ref={ref}>Content</CardContent>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardFooter', () => {
  it('renders with correct styles', () => {
    render(<CardFooter data-testid='card-footer'>Footer content</CardFooter>);

    const footer = screen.getByTestId('card-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex', 'items-center', 'pt-4');
    expect(footer).toHaveTextContent('Footer content');
  });

  it('applies custom className', () => {
    render(
      <CardFooter data-testid='card-footer' className='custom-footer'>
        Footer
      </CardFooter>
    );

    expect(screen.getByTestId('card-footer')).toHaveClass('custom-footer');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<CardFooter ref={ref}>Footer</CardFooter>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Card Integration', () => {
  it('renders complete card structure', () => {
    render(
      <Card data-testid='complete-card'>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description goes here</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main card content</p>
        </CardContent>
        <CardFooter>
          <button>Action Button</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId('complete-card')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description goes here')).toBeInTheDocument();
    expect(screen.getByText('Main card content')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Action Button' })
    ).toBeInTheDocument();
  });

  it('maintains proper hierarchy and structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent data-testid='content'>Content</CardContent>
        <CardFooter data-testid='footer'>Footer</CardFooter>
      </Card>
    );

    const title = screen.getByText('Title');
    const description = screen.getByText('Description');
    const content = screen.getByTestId('content');
    const footer = screen.getByTestId('footer');

    expect(title.tagName).toBe('H3');
    expect(description.tagName).toBe('P');
    expect(content).toHaveClass('pt-0');
    expect(footer).toHaveClass('flex', 'items-center', 'pt-4');
  });
});

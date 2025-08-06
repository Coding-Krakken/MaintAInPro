import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

describe('Tabs', () => {
  const TabsExample = ({
    defaultValue = 'tab1',
    className,
  }: {
    defaultValue?: string;
    className?: string;
  }) => (
    <Tabs defaultValue={defaultValue} className={className}>
      <TabsList>
        <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
        <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
        <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value='tab1'>Content 1</TabsContent>
      <TabsContent value='tab2'>Content 2</TabsContent>
      <TabsContent value='tab3'>Content 3</TabsContent>
    </Tabs>
  );

  beforeEach(() => {
    // Reset any DOM state before each test
    document.body.innerHTML = '';
  });

  describe('Tabs Component', () => {
    it('renders with default value', () => {
      render(<TabsExample />);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('shows correct initial content based on defaultValue', () => {
      render(<TabsExample defaultValue='tab2' />);

      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    });

    it('applies custom className to root element', () => {
      const { container } = render(<TabsExample className='custom-tabs' />);

      const tabsElement = container.firstChild as HTMLElement;
      expect(tabsElement).toHaveClass('w-full', 'custom-tabs');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Tabs defaultValue='tab1' ref={ref}>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('throws error when Tabs components used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<TabsTrigger value='test'>Test</TabsTrigger>);
      }).toThrow('Tabs components must be used within a Tabs provider');

      consoleSpy.mockRestore();
    });
  });

  describe('TabsList Component', () => {
    it('renders with proper styling', () => {
      render(<TabsExample />);

      const tabsList = screen.getByText('Tab 1').parentElement;
      expect(tabsList).toHaveClass(
        'inline-flex',
        'h-10',
        'items-center',
        'justify-center',
        'rounded-md',
        'bg-gray-100',
        'p-1'
      );
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList className='custom-list'>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByText('Tab 1').parentElement;
      expect(tabsList).toHaveClass('custom-list');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Tabs defaultValue='tab1'>
          <TabsList ref={ref}>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('TabsTrigger Component', () => {
    it('renders as button with proper attributes', () => {
      render(<TabsExample />);

      const trigger = screen.getByText('Tab 1');
      expect(trigger.tagName).toBe('BUTTON');
      expect(trigger).toHaveAttribute('type', 'button');
    });

    it('applies active styling for current tab', () => {
      render(<TabsExample defaultValue='tab1' />);

      const activeTab = screen.getByText('Tab 1');
      const inactiveTab = screen.getByText('Tab 2');

      expect(activeTab).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
      expect(inactiveTab).toHaveClass('text-gray-500');
    });

    it('switches tabs when clicked', () => {
      render(<TabsExample />);

      // Initially tab1 content is visible
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();

      // Click tab2
      fireEvent.click(screen.getByText('Tab 2'));

      // Now tab2 content is visible
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab3' {...{ disabled: true }}>
              Tab 3
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab3'>Content 3</TabsContent>
        </Tabs>
      );

      const disabledTab = screen.getByText('Tab 3');
      expect(disabledTab).toHaveClass(
        'disabled:pointer-events-none',
        'disabled:opacity-50'
      );
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1' className='custom-trigger'>
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>
      );

      const trigger = screen.getByText('Tab 1');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1' ref={ref}>
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('has proper accessibility attributes', () => {
      render(<TabsExample />);

      const trigger = screen.getByText('Tab 1');
      expect(trigger).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-blue-500'
      );
    });

    it('handles hover states', () => {
      render(<TabsExample />);

      const inactiveTab = screen.getByText('Tab 2');
      expect(inactiveTab).toHaveClass('hover:text-gray-900');
    });
  });

  describe('TabsContent Component', () => {
    it('shows content only when active', () => {
      render(<TabsExample defaultValue='tab1' />);

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    });

    it('switches content when tab changes', () => {
      render(<TabsExample />);

      // Click different tabs and verify content switches
      fireEvent.click(screen.getByText('Tab 2'));
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Tab 1'));
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });

    it('applies proper styling classes', () => {
      render(<TabsExample />);

      const content = screen.getByText('Content 1');
      expect(content).toHaveClass(
        'mt-2',
        'ring-offset-white',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-blue-500'
      );
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1' className='custom-content'>
            Content 1
          </TabsContent>
        </Tabs>
      );

      const content = screen.getByText('Content 1');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1' ref={ref}>
            Content 1
          </TabsContent>
        </Tabs>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('returns null when not active', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab2'>Hidden Content</TabsContent>
        </Tabs>
      );

      expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('handles complex tab switching scenarios', () => {
      render(<TabsExample />);

      // Start with tab1
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 1')).toHaveClass('bg-white');

      // Switch to tab2
      fireEvent.click(screen.getByText('Tab 2'));
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toHaveClass('bg-white');
      expect(screen.getByText('Tab 1')).toHaveClass('text-gray-500');

      // Switch back to tab1
      fireEvent.click(screen.getByText('Tab 1'));
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 1')).toHaveClass('bg-white');
      expect(screen.getByText('Tab 2')).toHaveClass('text-gray-500');
    });

    it('maintains proper aria and accessibility structure', () => {
      render(<TabsExample />);

      const triggers = screen.getAllByRole('button');
      expect(triggers).toHaveLength(3);

      triggers.forEach(trigger => {
        expect(trigger).toHaveClass('focus-visible:ring-2');
      });
    });

    it('works with different defaultValue configurations', () => {
      // Test with tab2 as default
      const { unmount } = render(<TabsExample defaultValue='tab2' />);
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toHaveClass('bg-white');
      unmount();

      // Test with tab1 as default
      render(<TabsExample defaultValue='tab1' />);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 1')).toHaveClass('bg-white');
    });
  });
});

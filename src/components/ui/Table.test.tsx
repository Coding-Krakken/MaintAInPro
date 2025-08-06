import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './Table';

describe('Table', () => {
  it('renders with correct structure and classes', () => {
    render(
      <Table data-testid='table'>
        <tbody>
          <tr>
            <td>Cell content</td>
          </tr>
        </tbody>
      </Table>
    );

    const table = screen.getByTestId('table');
    expect(table).toBeInTheDocument();
    expect(table.tagName).toBe('TABLE');
    expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
    expect(table.parentElement).toHaveClass('w-full', 'overflow-auto');
  });

  it('applies custom className', () => {
    render(
      <Table data-testid='table' className='custom-table'>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );

    expect(screen.getByTestId('table')).toHaveClass('custom-table');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <Table ref={ref}>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });

  it('is wrapped in overflow container', () => {
    render(
      <Table data-testid='table'>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );

    const table = screen.getByTestId('table');
    const wrapper = table.parentElement;
    expect(wrapper).toHaveClass('w-full', 'overflow-auto');
  });
});

describe('TableHeader', () => {
  it('renders as thead with correct classes', () => {
    render(
      <table>
        <TableHeader data-testid='table-header'>
          <tr>
            <th>Header</th>
          </tr>
        </TableHeader>
      </table>
    );

    const header = screen.getByTestId('table-header');
    expect(header).toBeInTheDocument();
    expect(header.tagName).toBe('THEAD');
    expect(header).toHaveClass('border-b', 'bg-gray-50');
  });

  it('applies custom className', () => {
    render(
      <table>
        <TableHeader data-testid='table-header' className='custom-header'>
          <tr>
            <th>Header</th>
          </tr>
        </TableHeader>
      </table>
    );

    expect(screen.getByTestId('table-header')).toHaveClass('custom-header');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <table>
        <TableHeader ref={ref}>
          <tr>
            <th>Header</th>
          </tr>
        </TableHeader>
      </table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });
});

describe('TableBody', () => {
  it('renders as tbody with correct classes', () => {
    render(
      <table>
        <TableBody data-testid='table-body'>
          <tr>
            <td>Body content</td>
          </tr>
        </TableBody>
      </table>
    );

    const body = screen.getByTestId('table-body');
    expect(body).toBeInTheDocument();
    expect(body.tagName).toBe('TBODY');
    expect(body).toHaveClass('divide-y', 'divide-gray-200');
  });

  it('applies custom className', () => {
    render(
      <table>
        <TableBody data-testid='table-body' className='custom-body'>
          <tr>
            <td>Content</td>
          </tr>
        </TableBody>
      </table>
    );

    expect(screen.getByTestId('table-body')).toHaveClass('custom-body');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <table>
        <TableBody ref={ref}>
          <tr>
            <td>Content</td>
          </tr>
        </TableBody>
      </table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });
});

describe('TableFooter', () => {
  it('renders as tfoot with correct classes', () => {
    render(
      <table>
        <TableFooter data-testid='table-footer'>
          <tr>
            <td>Footer content</td>
          </tr>
        </TableFooter>
      </table>
    );

    const footer = screen.getByTestId('table-footer');
    expect(footer).toBeInTheDocument();
    expect(footer.tagName).toBe('TFOOT');
    expect(footer).toHaveClass('bg-gray-50', 'font-medium');
  });

  it('applies custom className', () => {
    render(
      <table>
        <TableFooter data-testid='table-footer' className='custom-footer'>
          <tr>
            <td>Footer</td>
          </tr>
        </TableFooter>
      </table>
    );

    expect(screen.getByTestId('table-footer')).toHaveClass('custom-footer');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <table>
        <TableFooter ref={ref}>
          <tr>
            <td>Footer</td>
          </tr>
        </TableFooter>
      </table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });
});

describe('TableRow', () => {
  it('renders as tr with correct classes', () => {
    render(
      <table>
        <tbody>
          <TableRow data-testid='table-row'>
            <td>Row content</td>
          </TableRow>
        </tbody>
      </table>
    );

    const row = screen.getByTestId('table-row');
    expect(row).toBeInTheDocument();
    expect(row.tagName).toBe('TR');
    expect(row).toHaveClass(
      'border-b',
      'transition-colors',
      'hover:bg-gray-50'
    );
  });

  it('applies custom className', () => {
    render(
      <table>
        <tbody>
          <TableRow data-testid='table-row' className='custom-row'>
            <td>Content</td>
          </TableRow>
        </tbody>
      </table>
    );

    expect(screen.getByTestId('table-row')).toHaveClass('custom-row');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <table>
        <tbody>
          <TableRow ref={ref}>
            <td>Content</td>
          </TableRow>
        </tbody>
      </table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
  });
});

describe('TableHead', () => {
  it('renders as th with correct classes', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHead data-testid='table-head'>Header Cell</TableHead>
          </tr>
        </thead>
      </table>
    );

    const head = screen.getByTestId('table-head');
    expect(head).toBeInTheDocument();
    expect(head.tagName).toBe('TH');
    expect(head).toHaveClass(
      'h-12',
      'px-4',
      'text-left',
      'align-middle',
      'font-medium',
      'text-gray-500',
      'first:pl-6',
      'last:pr-6'
    );
    expect(head).toHaveTextContent('Header Cell');
  });

  it('applies custom className', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHead data-testid='table-head' className='custom-head'>
              Header
            </TableHead>
          </tr>
        </thead>
      </table>
    );

    expect(screen.getByTestId('table-head')).toHaveClass('custom-head');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <table>
        <thead>
          <tr>
            <TableHead ref={ref}>Header</TableHead>
          </tr>
        </thead>
      </table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
  });

  it('accepts th-specific attributes', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHead data-testid='table-head' scope='col' colSpan={2}>
              Header
            </TableHead>
          </tr>
        </thead>
      </table>
    );

    const head = screen.getByTestId('table-head');
    expect(head).toHaveAttribute('scope', 'col');
    expect(head).toHaveAttribute('colspan', '2');
  });
});

describe('TableCell', () => {
  it('renders as td with correct classes', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell data-testid='table-cell'>Cell content</TableCell>
          </tr>
        </tbody>
      </table>
    );

    const cell = screen.getByTestId('table-cell');
    expect(cell).toBeInTheDocument();
    expect(cell.tagName).toBe('TD');
    expect(cell).toHaveClass(
      'p-4',
      'align-middle',
      'text-gray-900',
      'first:pl-6',
      'last:pr-6'
    );
    expect(cell).toHaveTextContent('Cell content');
  });

  it('applies custom className', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell data-testid='table-cell' className='custom-cell'>
              Content
            </TableCell>
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByTestId('table-cell')).toHaveClass('custom-cell');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <table>
        <tbody>
          <tr>
            <TableCell ref={ref}>Content</TableCell>
          </tr>
        </tbody>
      </table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
  });

  it('accepts td-specific attributes', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell data-testid='table-cell' colSpan={3} rowSpan={2}>
              Cell
            </TableCell>
          </tr>
        </tbody>
      </table>
    );

    const cell = screen.getByTestId('table-cell');
    expect(cell).toHaveAttribute('colspan', '3');
    expect(cell).toHaveAttribute('rowspan', '2');
  });
});

describe('TableCaption', () => {
  it('renders as caption with correct classes', () => {
    render(
      <table>
        <TableCaption data-testid='table-caption'>
          Table description
        </TableCaption>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </table>
    );

    const caption = screen.getByTestId('table-caption');
    expect(caption).toBeInTheDocument();
    expect(caption.tagName).toBe('CAPTION');
    expect(caption).toHaveClass('mt-4', 'text-sm', 'text-gray-500');
    expect(caption).toHaveTextContent('Table description');
  });

  it('applies custom className', () => {
    render(
      <table>
        <TableCaption data-testid='table-caption' className='custom-caption'>
          Caption
        </TableCaption>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByTestId('table-caption')).toHaveClass('custom-caption');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <table>
        <TableCaption ref={ref}>Caption</TableCaption>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableCaptionElement);
  });
});

describe('Table Integration', () => {
  it('renders complete table structure', () => {
    render(
      <Table data-testid='complete-table'>
        <TableCaption>Complete table example</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>User</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total: 2 users</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByTestId('complete-table')).toBeInTheDocument();
    expect(screen.getByText('Complete table example')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Total: 2 users')).toBeInTheDocument();
  });

  it('maintains proper semantic structure', () => {
    render(
      <Table>
        <TableCaption>Semantic test</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    const caption = screen.getByText('Semantic test');
    const header = screen.getByText('Header');
    const data = screen.getByText('Data');
    const footer = screen.getByText('Footer');

    expect(caption.tagName).toBe('CAPTION');
    expect(header.tagName).toBe('TH');
    expect(data.tagName).toBe('TD');
    expect(footer.tagName).toBe('TD');
    expect(footer.closest('tfoot')).toBeInTheDocument();
  });
});

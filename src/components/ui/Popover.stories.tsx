import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './Popover';
import { Button } from './Button';

const meta: Meta<typeof Popover> = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
    },
    trigger: {
      control: { type: 'select' },
      options: ['click', 'hover'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: (
      <div className='space-y-2'>
        <h4 className='font-medium'>Popover Content</h4>
        <p className='text-sm text-muted-foreground'>
          This is the content of the popover. It can contain any React elements.
        </p>
      </div>
    ),
    children: <Button>Open popover</Button>,
  },
};

export const OnHover: Story = {
  args: {
    trigger: 'hover',
    content: (
      <div className='space-y-2'>
        <h4 className='font-medium'>Hover Popover</h4>
        <p className='text-sm text-muted-foreground'>
          This popover opens on hover.
        </p>
      </div>
    ),
    children: <Button>Hover me</Button>,
  },
};

export const WithForm: Story = {
  args: {
    content: (
      <div className='space-y-4'>
        <h4 className='font-medium'>Quick Actions</h4>
        <div className='space-y-2'>
          <button className='w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90'>
            Action 1
          </button>
          <button className='w-full px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90'>
            Action 2
          </button>
        </div>
      </div>
    ),
    children: <Button>Quick Actions</Button>,
  },
};

export const PositionTop: Story = {
  args: {
    side: 'top',
    content: (
      <div className='space-y-2'>
        <h4 className='font-medium'>Top Position</h4>
        <p className='text-sm text-muted-foreground'>
          This popover appears above the trigger.
        </p>
      </div>
    ),
    children: <Button>Top popover</Button>,
  },
};

export const PositionLeft: Story = {
  args: {
    side: 'left',
    content: (
      <div className='space-y-2'>
        <h4 className='font-medium'>Left Position</h4>
        <p className='text-sm text-muted-foreground'>
          This popover appears to the left of the trigger.
        </p>
      </div>
    ),
    children: <Button>Left popover</Button>,
  },
};

export const PositionRight: Story = {
  args: {
    side: 'right',
    content: (
      <div className='space-y-2'>
        <h4 className='font-medium'>Right Position</h4>
        <p className='text-sm text-muted-foreground'>
          This popover appears to the right of the trigger.
        </p>
      </div>
    ),
    children: <Button>Right popover</Button>,
  },
};

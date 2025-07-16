import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker, type DatePickerProps } from './DatePicker';
import { useState } from 'react';

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'inline'],
    },
    position: {
      control: { type: 'select' },
      options: ['default', 'right', 'center'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    showTime: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Select a date',
  },
};

const WithValueComponent = (args: DatePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <DatePicker {...args} value={date} onChange={setDate} />;
};

export const WithValue: Story = {
  render: WithValueComponent,
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled date picker',
    disabled: true,
  },
};

const WithMinMaxDateComponent = (args: DatePickerProps) => {
  const [date, setDate] = useState<Date | undefined>();
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return (
    <DatePicker
      {...args}
      value={date}
      onChange={setDate}
      minDate={minDate}
      maxDate={maxDate}
      placeholder='This month only'
    />
  );
};

export const WithMinMaxDate: Story = {
  render: WithMinMaxDateComponent,
};

const CustomFormatComponent = (args: DatePickerProps) => {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <DatePicker
      {...args}
      value={date}
      onChange={setDate}
      format='yyyy-MM-dd'
      placeholder='YYYY-MM-DD format'
    />
  );
};

export const CustomFormat: Story = {
  render: CustomFormatComponent,
};

export const RightAligned: Story = {
  args: {
    position: 'right',
    placeholder: 'Right-aligned calendar',
  },
};

const InlineVariantComponent = (args: DatePickerProps) => {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <DatePicker
      {...args}
      variant='inline'
      value={date}
      onChange={setDate}
      placeholder='Inline date picker'
    />
  );
};

export const InlineVariant: Story = {
  render: InlineVariantComponent,
};

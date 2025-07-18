import React from 'react';
import { Select, SelectProps } from './Select';

interface LabeledSelectProps extends SelectProps {
  onValueChange?: (value: string) => void;
}

const LabeledSelect = React.forwardRef<HTMLSelectElement, LabeledSelectProps>(
  ({ onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (onValueChange) {
        onValueChange(value);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return <Select ref={ref} onChange={handleChange} {...props} />;
  }
);

LabeledSelect.displayName = 'LabeledSelect';

export { LabeledSelect };
export type { LabeledSelectProps };

import React from 'react';
import { Checkbox, CheckboxProps } from './Checkbox';

interface LabeledCheckboxProps extends Omit<CheckboxProps, 'onCheckedChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

const LabeledCheckbox = React.forwardRef<
  HTMLInputElement,
  LabeledCheckboxProps
>(({ onCheckedChange, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (onCheckedChange) {
      onCheckedChange(checked);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return <Checkbox ref={ref} onChange={handleChange} {...props} />;
});

LabeledCheckbox.displayName = 'LabeledCheckbox';

export { LabeledCheckbox };
export type { LabeledCheckboxProps };

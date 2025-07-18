import { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/Input';
import {
  PasswordValidator,
  PasswordValidationResult,
} from '../services/passwordValidator';
import { cn } from '@/utils/cn';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  showStrengthIndicator?: boolean;
  showValidationErrors?: boolean;
  validateOnChange?: boolean;
  validator?: PasswordValidator;
  size?: 'default' | 'sm' | 'lg';
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showStrengthIndicator = true,
      showValidationErrors = true,
      validateOnChange = true,
      validator = new PasswordValidator(),
      onChange,
      size = 'default',
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState('');
    const [validation, setValidation] =
      useState<PasswordValidationResult | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
      if (validateOnChange && value) {
        const result = validator.validate(value);
        setValidation(result);
      } else {
        setValidation(null);
      }
    }, [value, validateOnChange, validator]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onChange?.(e);
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const getStrengthBarColor = (score: number) => {
      if (score < 20) return 'bg-red-500';
      if (score < 40) return 'bg-red-400';
      if (score < 60) return 'bg-yellow-400';
      if (score < 80) return 'bg-blue-400';
      return 'bg-green-500';
    };

    const getStrengthBarWidth = (score: number) => {
      return `${Math.max(score, 10)}%`; // Minimum 10% width for visibility
    };

    return (
      <div className='w-full space-y-2'>
        {label && (
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            {label}
          </label>
        )}
        <div className='relative'>
          <Input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            size={size}
            className={cn('pr-10', className)}
            {...props}
          />
          <button
            type='button'
            onClick={togglePasswordVisibility}
            className='absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none'
          >
            {showPassword ? (
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                />
              </svg>
            ) : (
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                />
              </svg>
            )}
          </button>
        </div>

        {/* Display error if provided */}
        {error && <p className='text-sm text-red-600'>{error}</p>}

        {/* Display helper text if provided and no error */}
        {helperText && !error && (
          <p className='text-sm text-gray-500'>{helperText}</p>
        )}

        {/* Password Strength Indicator */}
        {showStrengthIndicator && validation && value && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Password Strength:</span>
              <span
                className={cn(
                  'text-sm font-medium',
                  validator.getStrengthColor(validation.score)
                )}
              >
                {validator.getStrengthText(validation.score)}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  getStrengthBarColor(validation.score)
                )}
                style={{ width: getStrengthBarWidth(validation.score) }}
              />
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {showValidationErrors && validation && !validation.isValid && (
          <div className='space-y-1'>
            {validation.errors['map']((error, index) => (
              <p key={index} className='text-sm text-red-600 flex items-center'>
                <svg
                  className='w-4 h-4 mr-1'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Validation Suggestions */}
        {showValidationErrors &&
          validation &&
          validation.suggestions.length > 0 && (
            <div className='space-y-1'>
              <p className='text-sm text-gray-600 font-medium'>Suggestions:</p>
              {validation.suggestions.map((suggestion, index) => (
                <p
                  key={index}
                  className='text-sm text-gray-500 flex items-center'
                >
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {suggestion}
                </p>
              ))}
            </div>
          )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };

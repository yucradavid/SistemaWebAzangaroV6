import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
            {label}
            {props.required && <span className="text-[#C81E1E] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl border-2 text-[#0F172A]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent
            disabled:bg-[#F1F5F9] disabled:cursor-not-allowed
            ${error ? 'border-[#C81E1E]' : 'border-[#CBD5E1] hover:border-[#334155]'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[#C81E1E]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-[#334155]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

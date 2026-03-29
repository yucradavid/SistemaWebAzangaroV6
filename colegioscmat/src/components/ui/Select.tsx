import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
            {label}
            {props.required && <span className="text-[#C81E1E] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-4 py-2.5 pr-10 rounded-xl border-2 text-[#0F172A] appearance-none
              bg-white cursor-pointer
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent
              disabled:bg-[#F1F5F9] disabled:cursor-not-allowed
              ${error ? 'border-[#C81E1E]' : 'border-[#CBD5E1] hover:border-[#334155]'}
              ${className}
            `}
            {...props}
          >
            {options ? (
              options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              children
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#334155] pointer-events-none" />
        </div>
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

Select.displayName = 'Select';

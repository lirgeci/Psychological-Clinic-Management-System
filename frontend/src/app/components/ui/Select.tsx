import React, { forwardRef, SelectHTMLAttributes } from 'react';
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: {
    label: string;
    value: string | number;
  }[];
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        }
        <select
          ref={ref}
          className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}>
          
          <option value="" disabled>
            Select an option
          </option>
          {options.map((opt) =>
          <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>);

  }
);
Select.displayName = 'Select';
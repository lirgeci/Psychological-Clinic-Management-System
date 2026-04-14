import React, { forwardRef, TextareaHTMLAttributes } from 'react';
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        }
        <textarea
          ref={ref}
          className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props} />
        
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>);

  }
);
Textarea.displayName = 'Textarea';
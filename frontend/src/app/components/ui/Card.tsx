import React from 'react';
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}
export function Card({
  children,
  className = '',
  title,
  action,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden ${className}`}
      {...props}>
      
      {(title || action) &&
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          {title &&
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        }
          {action && <div>{action}</div>}
        </div>
      }
      <div className="p-6">{children}</div>
    </div>);

}
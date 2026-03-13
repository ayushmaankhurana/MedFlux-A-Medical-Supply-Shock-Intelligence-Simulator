import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: {
    value: string;
    label: string;
    subtitle?: string;
  }[];
}
export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className={`w-full ${className || ''}`}>
      {label &&
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      }
      <div className="relative">
        <select
          className="w-full appearance-none bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-md pl-3 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors cursor-pointer"
          {...props}>
          
          {options.map((opt) =>
          <option
            key={opt.value}
            value={opt.value}
            className="bg-slate-900 text-slate-100 py-2">
            
              {opt.label} {opt.subtitle ? `— ${opt.subtitle}` : ''}
            </option>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <ChevronDownIcon className="h-4 w-4" />
        </div>
      </div>
    </div>);

}
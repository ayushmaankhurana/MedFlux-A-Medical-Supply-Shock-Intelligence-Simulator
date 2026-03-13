import React from 'react';
import { cn } from '../../lib/utils'; // Assuming a standard cn utility, will create if needed. Let's create a simple one inline or in a utils file.
// We need a simple classNames utility
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props



}: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary' | 'secondary' | 'warning' | 'ghost' | 'outline';size?: 'sm' | 'md' | 'lg';}) {
  const baseStyles =
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    primary:
    'bg-cyan-600 text-white hover:bg-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    secondary:
    'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
    warning:
    'bg-orange-600 text-white hover:bg-orange-700 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
    ghost: 'hover:bg-slate-800 text-slate-300 hover:text-white',
    outline:
    'border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white'
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 text-base'
  };
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`}
      {...props}>
      
      {children}
    </button>);

}
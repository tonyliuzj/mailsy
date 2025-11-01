import React from 'react';

export function Badge({ children, variant = 'default', className = '', ...props }) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const variants = {
    default: 'bg-accent text-accent-foreground',
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-muted text-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-100',
    error: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-100',
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

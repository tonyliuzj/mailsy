import React from 'react';

export function Button({ children, variant = 'default', size = 'md', className = '', ...props }) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-muted text-foreground hover:bg-muted/80 border border-border focus:ring-border',
    outline: 'border border-border bg-background text-foreground hover:bg-accent focus:ring-border',
    destructive: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-600',
    ghost: 'text-foreground hover:bg-muted/60 focus:ring-muted',
    link: 'text-primary underline-offset-2 hover:underline'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, variant = 'ghost', size = 'md', className = '', ...props }) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'text-foreground hover:bg-muted/60',
    secondary: 'text-muted-foreground hover:bg-muted/50',
    ghost: 'text-muted-foreground hover:bg-muted/60',
    link: 'text-primary underline-offset-2 hover:underline'
  };

  const sizes = {
    sm: 'p-2 text-sm',
    md: 'p-2.5 text-sm',
    lg: 'p-3 text-base',
    xl: 'p-3.5 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

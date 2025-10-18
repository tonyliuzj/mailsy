import React from 'react';

export function Badge({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    primary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white',
    secondary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
    success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
    warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
    error: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
  };

  return (
    <span className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

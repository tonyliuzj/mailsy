'use client';

import React from 'react';
import { Button as ShadcnButton } from '../ui/button';

export function Button({ children, variant = 'default', size = 'md', className = '', ...props }) {
  // Map custom variants to shadcn variants
  const variantMap = {
    default: 'default',
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline',
    destructive: 'destructive',
    ghost: 'ghost',
    link: 'link'
  };

  // Map custom sizes to shadcn sizes
  const sizeMap = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
    xl: 'lg'
  };

  return (
    <ShadcnButton
      variant={variantMap[variant] || 'default'}
      size={sizeMap[size] || 'default'}
      className={className}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}

export function IconButton({ children, variant = 'ghost', size = 'md', className = '', ...props }) {
  const variantMap = {
    primary: 'ghost',
    secondary: 'ghost',
    ghost: 'ghost',
    link: 'link'
  };

  const sizeMap = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
    xl: 'lg'
  };

  return (
    <ShadcnButton
      variant={variantMap[variant] || 'ghost'}
      size={sizeMap[size] || 'default'}
      className={className}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}

'use client';

import React from 'react';
import { Badge as ShadcnBadge } from '../ui/badge';

export function Badge({ children, variant = 'default', className = '', ...props }) {
  // Map custom variants to shadcn variants
  const variantMap = {
    default: 'default',
    primary: 'default',
    secondary: 'secondary',
    success: 'default',
    warning: 'default',
    error: 'destructive',
  };

  return (
    <ShadcnBadge
      variant={variantMap[variant] || 'default'}
      className={className}
      {...props}
    >
      {children}
    </ShadcnBadge>
  );
}

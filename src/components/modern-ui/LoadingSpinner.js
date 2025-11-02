'use client';

import React from 'react';
import { Skeleton } from '../ui/skeleton';

export function LoadingSpinner({ size = 'md', className = '', ...props }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2'
  };

  return (
    <div
      className={`animate-spin rounded-full border-muted border-t-primary ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function SkeletonLoader({ lines = 3, className = '', ...props }) {
  return (
    <div className={`space-y-3 ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function Shimmer({ className = '', ...props }) {
  return (
    <Skeleton className={`animate-shimmer ${className}`} {...props} />
  );
}

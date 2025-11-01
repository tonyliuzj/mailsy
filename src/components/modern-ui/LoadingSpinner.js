import React from 'react';

export function LoadingSpinner({ size = 'md', className = '', ...props }) {
  const sizes = {
    sm: 'w-4 h-4 border-2 border-muted border-t-primary',
    md: 'w-6 h-6 border-2 border-muted border-t-primary',
    lg: 'w-8 h-8 border-2 border-muted border-t-primary'
  };

  return (
    <div className={`animate-spin rounded-full ${sizes[size]} ${className}`} {...props} />
  );
}

export function SkeletonLoader({ lines = 3, className = '', ...props }) {
  return (
    <div className={`space-y-3 ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted rounded">
          <div className="h-4"></div>
        </div>
      ))}
    </div>
  );
}

export function Shimmer({ className = '', ...props }) {
  return (
    <div className={`animate-shimmer bg-muted rounded ${className}`} {...props} />
  );
}

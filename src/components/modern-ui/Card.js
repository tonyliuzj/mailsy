import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 border-b border-border/80 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 bg-muted text-muted-foreground border-t border-border/80 ${className}`} {...props}>
      {children}
    </div>
  );
}

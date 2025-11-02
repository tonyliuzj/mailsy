'use client';

import React from 'react';
import { Input as ShadcnInput } from '../ui/input';

export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          {label}
        </label>
      )}
      <ShadcnInput
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        {...props}
      />
    </div>
  );
};

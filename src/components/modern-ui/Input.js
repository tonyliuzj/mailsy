import React from 'react';

export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  className = '',
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:border-primary sm:text-sm disabled:bg-muted/60 disabled:text-muted-foreground ${className}`}
      />
    </div>
  );
};

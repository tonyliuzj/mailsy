'use client';

import React, { useState, useEffect } from 'react';
import { Input as ShadcnInput } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-react';

export function EmailInput({ 
  label, 
  value, 
  onChange, 
  domains, 
  selectedDomain, 
  onDomainChange, 
  placeholder = "your-email",
  disabled = false,
  onRandom = null
}) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const getDisplayText = () => {
    if (!localValue) return placeholder;
    const domain = domains.find(d => d.name === selectedDomain);
    return domain ? `${localValue}@${domain.name}` : localValue;
  };

  const handleRandomClick = () => {
    if (onRandom) {
      onRandom();
    }
  };

  if (domains.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-400/40 rounded-md p-4">
        <p className="text-sm text-red-800 dark:text-red-200">
          No active domains available. Please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-visible">
      {label && (
        <label className="block text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="flex flex-col sm:flex-row gap-2 overflow-visible">
        <div className="flex-1 flex flex-col sm:flex-row relative z-10 overflow-visible">
          <ShadcnInput
            type="text"
            value={localValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 sm:rounded-r-none rounded-b-none sm:rounded-b-md"
          />
          <select
            value={selectedDomain}
            onChange={(e) => onDomainChange(e.target.value)}
            disabled={disabled}
            className="appearance-none h-9 bg-background border sm:border-l-0 border-t-0 sm:border-t border-input px-3 py-1 pr-8 text-sm sm:text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:rounded-r-md rounded-t-none sm:rounded-t-md rounded-b-md relative z-20 min-w-0"
          >
            {domains.map(domain => (
              <option key={domain.id} value={domain.name}>
                @{domain.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 bottom-2.5 sm:top-2.5 h-4 w-4 opacity-50 pointer-events-none z-30" />
        </div>
        {onRandom && (
          <Button
            type="button"
            onClick={handleRandomClick}
            disabled={disabled}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Random
          </Button>
        )}
      </div>
      <div className="text-sm text-muted-foreground break-all">
        Full email: <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">
          {getDisplayText()}
        </span>
      </div>
    </div>
  );
}

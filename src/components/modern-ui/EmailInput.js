'use client';

import React, { useState, useEffect } from 'react';
import { Input as ShadcnInput } from '../ui/input';
import { Button } from '../ui/button';

export function EmailInput({ 
  label, 
  value, 
  onChange, 
  domains, 
  selectedDomain, 
  onDomainChange, 
  placeholder = "your-email",
  disabled = false,
  accountType = "temporary",
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

  const generateRandomPrefix = () => {
    const adjectives = ['quick', 'swift', 'fast', 'rapid', 'instant', 'speedy', 'hasty', 'nimble'];
    const nouns = ['mail', 'email', 'message', 'letter', 'note', 'memo', 'dispatch', 'courier'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    return `${randomAdj}${randomNoun}${randomNumber}`;
  };

  const handleRandomClick = () => {
    const randomPrefix = generateRandomPrefix();
    setLocalValue(randomPrefix);
    onChange(randomPrefix);
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
      <div className="flex gap-2 overflow-visible">
        <div className="flex-1 flex relative z-10 overflow-visible">
          <ShadcnInput
            type="text"
            value={localValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 rounded-r-none"
          />
          <select
            value={selectedDomain}
            onChange={(e) => onDomainChange(e.target.value)}
            disabled={disabled}
            className="appearance-none h-9 bg-background border border-l-0 border-input px-3 py-1 pr-8 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-r-md relative z-20"
          >
            {domains.map(domain => (
              <option key={domain.id} value={domain.name}>
                @{domain.name}
              </option>
            ))}
          </select>
        </div>
        {onRandom && (
          <Button
            type="button"
            onClick={handleRandomClick}
            disabled={disabled}
            variant="outline"
          >
            Random
          </Button>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        Full email: <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">
          {getDisplayText()}
        </span>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

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
  const [displayValue, setDisplayValue] = useState('');

useEffect(() => {
    if (value) {
      const domain = domains.find(d => d.name === selectedDomain);
      if (domain) {
        setDisplayValue(`${value}@${domain.name}`);
      }
    } else {
      setDisplayValue('');
    }
    setLocalValue(value || '');
  }, [value, selectedDomain, domains]);

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
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="flex space-x-2">
          <div className="flex-1 flex">
            <input
              type="text"
              value={localValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-r-0 border-border shadow-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:border-primary disabled:bg-muted/60 disabled:text-muted-foreground disabled:cursor-not-allowed"
            />
            <div className="relative">
              <select
                value={selectedDomain}
                onChange={(e) => onDomainChange(e.target.value)}
                disabled={disabled}
                className="appearance-none bg-background border border-l-0 border-border px-3 py-2 pr-8 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:border-primary disabled:bg-muted/60 disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {domains.map(domain => (
                  <option key={domain.id} value={domain.name}>
                    @{domain.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          {onRandom && (
            <button
              type="button"
              onClick={handleRandomClick}
              disabled={disabled}
              className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-md text-sm font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Random
            </button>
          )}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Full email: <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">
            {getDisplayText()}
          </span>
        </div>
      </div>
    </div>
  );
}

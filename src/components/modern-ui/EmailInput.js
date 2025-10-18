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
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-800">
          No active domains available. Please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
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
              className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-r-0 border-gray-300 shadow-sm focus:outline-none focus:ring-black focus:border-black ${
                disabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <div className="relative">
<select
                value={selectedDomain}
                onChange={(e) => onDomainChange(e.target.value)}
                disabled={disabled}
                className="appearance-none bg-white border border-l-0 border-gray-300 px-3 py-2 pr-8 focus:outline-none focus:ring-black focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {domains.map(domain => (
                  <option key={domain.id} value={domain.name}>
                    @{domain.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🎲 Random
            </button>
          )}
        </div>
        
        {}
        <div className="mt-1 text-sm text-gray-500">
          Full email: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
            {getDisplayText()}
          </span>
        </div>
      </div>
    </div>
  );
}

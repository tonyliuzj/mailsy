import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { Badge } from './Badge';

export function Layout({ children, siteTitle = 'Mailsy', user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {}
      <nav className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold">{siteTitle}</h1>
                </div>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/inbox"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  Inbox
                </Link>
              )}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-md ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'}`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
            
            {}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-md ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'}`}
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>
        
        {}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/inbox"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Inbox
                </Link>
              )}
              <button
                onClick={toggleDarkMode}
                className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {darkMode ? '☀️' : '🌙'}
                <span className="ml-2">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {}
      <footer className={`${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'} py-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center space-x-6 md:order-2">
              <Link href="/" className={`text-gray-400 hover:text-gray-500 ${darkMode ? 'hover:text-gray-300' : ''}`}>
                <span className="sr-only">Home</span>
                🏠
              </Link>
            </div>
            <div className="mt-8 md:order-1 md:mt-0">
              <p className={`text-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                © 2024 Mailsy. A modern temporary email service.{' '}
                <Link
                  href="https://github.com/tonyliuzj/Mailsy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} underline`}
                >
                  Open source
                </Link>
                {' '} powered by{' '}
                <Link
                  href="https://tony-liu.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} underline`}
                >
                  tony-liu.com
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

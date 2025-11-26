import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const ICONS = {
  sun: '\u2600', // ☀
  moon: '\u263E', // ☾
  close: '\u2715', // ✕
  menu: '\u2630', // ☰
  home: '\u2302', // ⌂
};

export function Layout({ children, siteTitle = 'Mailsy', user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    setDarkMode(root.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);

    if (typeof document === 'undefined') {
      return;
    }

    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  const navLinkClasses =
    'px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors';

  const mobileNavLinkClasses =
    'block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors';

  return (
    <div className={`min-h-screen flex flex-col bg-background text-foreground transition-colors ${darkMode ? 'dark' : ''}`}>
      <nav className="bg-card/80 backdrop-blur shadow-sm border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                    <span className="text-primary-foreground font-bold text-sm">M</span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-foreground transition-colors">{siteTitle}</h1>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/" className={navLinkClasses}>
                Home
              </Link>
              {user && (
                <Link href="/inbox" className={navLinkClasses}>
                  Inbox
                </Link>
              )}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle theme"
                aria-pressed={darkMode}
              >
                {darkMode ? ICONS.sun : ICONS.moon}
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? ICONS.close : ICONS.menu}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-border/60 transition-colors">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className={mobileNavLinkClasses} onClick={closeMenu}>
                Home
              </Link>
              {user && (
                <Link href="/inbox" className={mobileNavLinkClasses} onClick={closeMenu}>
                  Inbox
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  toggleDarkMode();
                  closeMenu();
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle theme"
                aria-pressed={darkMode}
              >
                {darkMode ? ICONS.sun : ICONS.moon}
                <span className="ml-2">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">{children}</main>

      <footer className="bg-card border-t border-border py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center space-x-6 md:order-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">Home</span>
                {ICONS.home}
              </Link>
            </div>
            <div className="mt-8 md:order-1 md:mt-0">
              <p className="text-center text-xs text-muted-foreground transition-colors">
                © 2024 Mailsy. A modern temporary email service{' '}
                <Link
                  href="https://github.com/tonyliuzj/Mailsy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-foreground hover:text-primary transition-colors"
                >
                  Open source
                </Link>{' '}
                powered by{' '}
                <Link
                  href="https://tony-liu.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-foreground hover:text-primary transition-colors"
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

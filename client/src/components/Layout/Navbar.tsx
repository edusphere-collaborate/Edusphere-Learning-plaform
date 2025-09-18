import { Link, useLocation } from 'wouter';
import { GraduationCap, Sun, Moon, LogOut, LogIn, ChevronRight, X } from 'lucide-react';
import EdusphereLogo from '@/assets/Edusphere.png';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#cta', label: 'Get Started' },
  ];

  const handleLinkClick = () => setIsOpen(false);
  const toggleMobileMenu = () => setIsOpen(!isOpen);

  // Handle smooth scrolling to sections - navigate to home first if not already there
  const handleSectionClick = (href: string) => {
    const targetId = href.replace('#', '');
    
    // If we're not on the landing page, navigate there first with the hash
    if (location !== '/') {
      window.location.href = `/${href}`;
      handleLinkClick(); // Close mobile menu
      return;
    }
    
    // If we're already on the landing page, scroll to the section
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    handleLinkClick(); // Close mobile menu
  };

  return (
    <>
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group" data-testid="logo-link">
              <img 
                src={EdusphereLogo} 
                alt="Edusphere Logo" 
                className="w-10 h-10 object-contain group-hover:scale-105 transition-all duration-300"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Edusphere
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleSectionClick(item.href)}
                  className="relative text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-300 px-4 py-2 rounded-lg group cursor-pointer"
                >
                  {item.label}
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </button>
              ))}
            </div>
            
            {/* Actions (Theme + Auth + Hamburger) */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle (Visible on all screens) */}
              <Button
                variant="ghost"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
                className="relative px-3 py-2 h-10 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 items-center justify-center gap-2 group shadow-sm hover:shadow-md hover:scale-105"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-180 transition-transform duration-300" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600 group-hover:rotate-12 transition-transform duration-300" />
                )}
                <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </span>
              </Button>
              
              {/* Auth Buttons - Desktop */}
              {user ? (
                <div className="hidden md:flex items-center space-x-3">
                  <Link href="/rooms">
                    <Button 
                      variant="ghost" 
                      className="font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-xl"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-xl flex items-center gap-2 border-gray-200 dark:border-gray-600 transition-all duration-300"
                    >
                      <LogIn className="w-4 h-4" />
                      Login
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Mobile Menu Button (Hamburger) */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden relative z-50 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm" 
                onClick={toggleMobileMenu}
                data-testid="button-mobile-menu"
              >
                <div className="flex flex-col justify-between w-5 h-4">
                  <span
                    className={`block h-0.5 w-full rounded bg-gray-700 dark:bg-gray-300 transform transition duration-300 ${
                      isOpen ? "translate-y-1.5 rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-full rounded bg-gray-700 dark:bg-gray-300 transform transition duration-300 ${
                      isOpen ? "opacity-0 scale-x-0" : ""
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-full rounded bg-gray-700 dark:bg-gray-300 transform transition duration-300 ${
                      isOpen ? "-translate-y-1.5 -rotate-45" : ""
                    }`}
                  />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-500 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 md:hidden transform transition-transform duration-500 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${theme === 'dark' ? 'bg-gray-900/95 border-l border-gray-700' : 'bg-white/95 border-l border-gray-200'} shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <img 
              src={EdusphereLogo} 
              alt="Edusphere Logo" 
              className="w-9 h-9 object-contain"
            />
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Edusphere
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(false)}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5 text-gray-500 hover:text-red-500" />
          </Button>
        </div>
        
        {/* Menu Content */}
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <div className="flex-1 px-6 py-6 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleSectionClick(item.href)}
                className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 cursor-pointer"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            ))}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Account
            </h3>
            {user ? (
              <div className="space-y-3">
                <Link href="/rooms" onClick={handleLinkClick}>
                  <Button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-base flex items-center justify-between">
                    Dashboard
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    handleLinkClick();
                  }}
                  className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl font-medium text-base flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href="/login" onClick={handleLinkClick}>
                  <Button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-base flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={handleLinkClick}>
                  <Button
                    variant="outline"
                    className="w-full py-3 border-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-medium text-base"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

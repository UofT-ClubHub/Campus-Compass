"use client"

import Link from "next/link"
import { auth } from '@/model/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { User as UserType } from '@/model/types';
import { useTheme } from '@/contexts/ThemeContext';

// NavButton component for enhanced navigation
interface NavButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isActive: boolean;
  label: string;
  index: number;
}

const NavButton = ({ onClick, isActive, label, index }: NavButtonProps) => (
  <button
    onClick={onClick}
    data-nav-index={index}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer bg-transparent border-0 relative z-10 ${
      isActive 
        ? 'text-gray-900 dark:text-gray-100 font-semibold' 
        : 'text-muted-foreground hover:text-foreground hover:scale-102'
    }`}
    type="button"
  >
    {label}
  </button>
);

export function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, toggleTheme, getThemeIcon } = useTheme();
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
    const navRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string) => {
        return pathname === path;
    };

    // Get the current active index based on pathname
    const getCurrentActiveIndex = useCallback(() => {
        if (pathname === '/clubSearch') return 0;
        if (pathname === '/postFilter') return 1;
        if (pathname === '/admin' && userData?.is_admin) return 2;
        if (pathname === '/exec' && userData?.managed_clubs && userData.managed_clubs.length > 0) {
            return userData?.is_admin ? 3 : 2;
        }
        if (pathname === '/pending-club-request') {
            const hasAdmin = userData?.is_admin;
            const hasExec = userData?.managed_clubs && userData.managed_clubs.length > 0;
            if (hasAdmin && hasExec) return 4;
            if (hasAdmin || hasExec) return 3;
            return 2;
        }
        // Return -1 for paths that shouldn't show the indicator (like home, profile, etc.)
        return -1;
    }, [pathname, userData]);

    // Update indicator position based on active button
    useEffect(() => {
        if (navRef.current) {
            const activeIndex = getCurrentActiveIndex();
            if (activeIndex === -1) {
                // Hide the indicator when no nav item should be active
                setIndicatorStyle({ left: 0, width: 0 });
            } else {
                const activeButton = navRef.current.querySelector(`[data-nav-index="${activeIndex}"]`) as HTMLElement;
                if (activeButton) {
                    const navRect = navRef.current.getBoundingClientRect();
                    const buttonRect = activeButton.getBoundingClientRect();
                    const left = buttonRect.left - navRect.left;
                    setIndicatorStyle({
                      left: left,
                      width: buttonRect.width
                    });
                }
            }
        }
    }, [pathname, userData, getCurrentActiveIndex]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch user data to check roles
    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    const response = await fetch(`/api/users?id=${user.uid}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                setUserData(null);
            }
        };

        if (!loading && user) {
            fetchUserData();
        }
    }, [user, loading]);    
    
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
            window.location.reload();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleNavigation = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        router.push(path);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const isAdmin = userData?.is_admin;
    const isExecutive = userData?.managed_clubs && userData.managed_clubs.length > 0;

    return (
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary hover:text-secondary transition-colors">
                Campus Compass
              </Link>
            </div>

            {/* Enhanced Desktop Navigation */}
            <nav className="hidden md:flex items-center">
              <div ref={navRef} className="flex items-center bg-muted/50 rounded-full px-2 py-1 backdrop-blur-sm relative">
                {/* Sliding indicator */}
                <div 
                  className={`absolute bg-primary/70 shadow-md shadow-primary/15 ring-1 ring-primary/15 rounded-full transition-all duration-300 ease-in-out ${
                    indicatorStyle.width === 0 ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                    height: '32px',
                    top: '7px',
                  }}
                />
                
                
                <NavButton
                  onClick={(e) => handleNavigation(e, "/clubSearch")}
                  isActive={isActive("/clubSearch")}
                  label="Clubs"
                  index={0}
                />
                <NavButton
                  onClick={(e) => handleNavigation(e, "/postFilter")}
                  isActive={isActive("/postFilter")}
                  label="Posts"
                  index={1}
                />
                {isAdmin && (
                  <NavButton onClick={(e) => handleNavigation(e, "/admin")} isActive={isActive("/admin")} label="Admin" index={2} />
                )}
                {isExecutive && (
                  <NavButton
                    onClick={(e) => handleNavigation(e, "/exec")}
                    isActive={isActive("/exec")}
                    label="Executive"
                    index={isAdmin ? 3 : 2}
                  />
                )}
                <NavButton
                  onClick={(e) => handleNavigation(e, "/pending-club-request")}
                  isActive={isActive("/pending-club-request")}
                  label="Request Club"
                  index={isAdmin && isExecutive ? 4 : isAdmin || isExecutive ? 3 : 2}
                />
              </div>
            </nav>

            {/* Desktop User Menu */}
            <nav className="hidden md:flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle theme"
                type="button"
              >
                <span className="flex items-center justify-center w-5 h-5">
                  {getThemeIcon(theme)}
                </span>
              </button>
              
              {loading && (
                <p className="text-sm text-muted-foreground">Loading...</p>
              )}
              {!loading && !user && (
                <button 
                  onClick={(e) => handleNavigation(e, '/auth')}
                  className="bg-primary hover:bg-secondary text-primary-foreground px-4 py-2 rounded-md font-semibold transition-colors duration-150 ease-in-out cursor-pointer"
                  type="button"
                >   
                  Login / Register
                </button>
              )}
              {!loading && user && (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => handleNavigation(e, '/profile')}
                    className="text-muted-foreground hover:text-secondary transition-colors cursor-pointer bg-transparent border-0 p-0"
                    type="button"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="bg-destructive hover:bg-destructive/80 text-destructive-foreground px-4 py-2 rounded-md font-semibold transition-colors duration-150 ease-in-out cursor-pointer"
                    type="button"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </nav>        
                
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle theme"
                type="button"
              >
                <span className="flex items-center justify-center w-5 h-5">
                  {getThemeIcon(theme)}
                </span>
              </button>
              
              {/* Always show mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-muted-foreground hover:text-secondary transition-colors cursor-pointer"
                aria-label="Toggle mobile menu"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-card border-t border-border">
              <nav className="px-4 py-4 space-y-4">
                <button
                  onClick={(e) => handleNavigation(e, '/')}
                  className={`block w-full text-left transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                    isActive('/') 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground hover:text-secondary'
                  }`}
                  type="button"
                >
                  Home
                </button>
                <button 
                  onClick={(e) => handleNavigation(e, '/clubSearch')}
                  className={`block w-full text-left transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                    isActive('/clubSearch') 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground hover:text-secondary'
                  }`}
                  type="button"
                >
                  Clubs
                </button>
                <button 
                  onClick={(e) => handleNavigation(e, '/postFilter')}
                  className={`block w-full text-left transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                    isActive('/postFilter') 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground hover:text-secondary'
                  }`}
                  type="button"
                >
                  Posts
                </button>
                {user && isAdmin && (
                  <button 
                    onClick={(e) => handleNavigation(e, '/admin')}
                    className={`block w-full text-left transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                      isActive('/admin') 
                        ? 'text-primary font-medium' 
                        : 'text-muted-foreground hover:text-secondary'
                    }`}
                    type="button"
                  >
                    Admin
                  </button>
                )}
                {user && isExecutive && (
                  <button 
                    onClick={(e) => handleNavigation(e, '/exec')}
                    className={`block w-full text-left transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                      isActive('/exec') 
                        ? 'text-primary font-medium' 
                        : 'text-muted-foreground hover:text-secondary'
                    }`}
                    type="button"
                  >
                    Executive
                  </button>
                )}
                <button 
                  onClick={(e) => handleNavigation(e, '/pending-club-request')}
                  className={`block w-full text-left transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                    isActive('/pending-club-request') 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground hover:text-secondary'
                  }`}
                  type="button"
                >
                  Request Club
                </button>
                
                <hr className="border-border" />
                
                {!loading && !user && (
                  <button 
                    onClick={(e) => handleNavigation(e, '/auth')}
                    className="block w-full text-left bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md font-semibold transition-colors duration-150 ease-in-out cursor-pointer"
                    type="button"
                  >   
                    Login / Register
                  </button>
                )}
                
                {!loading && user && (
                  <>
                    <button 
                      onClick={(e) => handleNavigation(e, '/profile')}
                      className="block w-full text-left text-muted-foreground hover:text-secondary transition-colors cursor-pointer bg-transparent border-0 p-0"
                      type="button"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left bg-destructive hover:bg-destructive/80 text-destructive-foreground px-4 py-2 rounded-md font-semibold transition-colors duration-150 ease-in-out cursor-pointer"
                      type="button"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    );
}
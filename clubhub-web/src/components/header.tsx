"use client"

import Link from "next/link"
import { auth } from '@/model/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User as UserType } from '@/model/types';
import { useTheme } from '@/contexts/ThemeContext';

export function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, toggleTheme, getThemeIcon } = useTheme();

    const isActive = (path: string) => {
        return pathname === path;
    };

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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <div className="flex space-x-6">
                <button
                  onClick={(e) => handleNavigation(e, '/')}
                  className={`transition-colors cursor-pointer bg-transparent border-0 p-0 ${
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
                  className={`transition-colors cursor-pointer bg-transparent border-0 p-0 ${
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
                  className={`transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                    isActive('/postFilter') 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground hover:text-secondary'
                  }`}
                  type="button"
                >
                  Posts
                </button>
                {isAdmin && (
                  <button 
                    onClick={(e) => handleNavigation(e, '/admin')}
                    className={`transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                      isActive('/admin') 
                        ? 'text-primary font-medium' 
                        : 'text-muted-foreground hover:text-secondary'
                    }`}
                    type="button"
                  >
                    Admin
                  </button>
                )}
                {isExecutive && (
                  <button 
                    onClick={(e) => handleNavigation(e, '/exec')}
                    className={`transition-colors cursor-pointer bg-transparent border-0 p-0 ${
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
                  className={`transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                    isActive('/pending-club-request') 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground hover:text-secondary'
                  }`}
                  type="button"
                >
                  Request Club
                </button>
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
              
              {!loading && !user && (
                <button 
                  onClick={(e) => handleNavigation(e, '/auth')}
                  className="bg-primary hover:bg-secondary text-primary-foreground px-3 py-2 rounded-md font-semibold transition-colors duration-150 ease-in-out text-sm cursor-pointer"
                  type="button"
                >   
                  Login
                </button>
              )}
              {!loading && user && (
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
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && user && (
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
                  Search
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
                {isAdmin && (
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
                {isExecutive && (
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
              </nav>
            </div>
          )}
        </div>
      </header>
    );
}
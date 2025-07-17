"use client"

import Link from "next/link"
import { auth } from '@/model/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User as UserType } from '@/model/types';

export function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/auth'); // Redirect to auth page after logout
            setIsMobileMenuOpen(false); // Close mobile menu after logout
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-5">
        {/* Logo and Desktop Navigation */}
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link 
            href="/" 
            className={`text-lg font-semibold transition-colors ${
              isActive('/') 
                ? 'text-[#1E3765]' 
                : 'text-[#1E3765] hover:text-[#6FC7EA]'
            }`}
          >
            Campus Compass
          </Link> 
          <div className="hidden md:flex items-center gap-3 sm:gap-5">
            <Link 
              href="/clubSearch" 
              className={`transition-colors ${
                isActive('/clubSearch') 
                  ? 'text-[#1E3765] font-medium' 
                  : 'text-gray-700 hover:text-[#6FC7EA]'
              }`}
            >
              Clubs
            </Link>
            <Link 
              href="/postFilter" 
              className={`transition-colors ${
                isActive('/postFilter') 
                  ? 'text-[#1E3765] font-medium' 
                  : 'text-gray-700 hover:text-[#6FC7EA]'
              }`}
            >
              Posts
            </Link>
            <Link 
              href="/pending-club-request" 
              className={`transition-colors ${
                isActive('/pending-club-request') 
                  ? 'text-[#1E3765] font-medium' 
                  : 'text-gray-700 hover:text-[#6FC7EA]'
              }`}
            >
              Request Club
            </Link>
          </div>
        </nav>

        {/* Desktop User Menu */}
        <nav className="hidden md:flex items-center gap-4">
          {loading && (
            <p className="text-sm text-gray-500">Loading...</p>
          )}
          {!loading && !user && (
            <button 
              onClick={() => router.push('/auth')}
              className="bg-[#1E3765] hover:bg-[#6FC7EA] text-white px-4 py-2 rounded-md font-semibold transition-colors duration-150 ease-in-out"
            >   
              Login / Register
            </button>
          )}
          {!loading && user && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium hidden lg:inline">{user.email}</span>
                <span className="font-medium lg:hidden">{user.email?.split('@')[0]}</span>
              </div>
              <Link 
                href="/profile" 
                className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-150 ease-in-out ${
                  isActive('/profile') 
                    ? 'bg-[#1E3765] text-white' 
                    : 'bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700'
                }`}
              >
                Profile
              </Link>
              {userData?.is_admin && (
                <Link 
                  href="/admin" 
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-150 ease-in-out ${
                    isActive('/admin') 
                      ? 'bg-[#1E3765] text-white' 
                      : 'bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700'
                  }`}
                >
                  Admin
                </Link>
              )}
              {(userData?.is_executive || userData?.is_admin) && (
                <Link 
                  href="/exec" 
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-150 ease-in-out ${
                    isActive('/exec') 
                      ? 'bg-[#1E3765] text-white' 
                      : 'bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700'
                  }`}
                >
                  Exec
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold transition-colors duration-150 ease-in-out"
              >   
                Logout
              </button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          {!loading && !user && (
            <button 
              onClick={() => router.push('/auth')}
              className="bg-[#1E3765] hover:bg-[#6FC7EA] text-white px-3 py-2 rounded-md font-semibold transition-colors duration-150 ease-in-out text-sm"
            >   
              Login
            </button>
          )}
          {!loading && user && (
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 hover:text-[#6FC7EA] transition-colors"
              aria-label="Toggle mobile menu"
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
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-3">
            {/* Mobile Navigation Links */}
            <div className="flex flex-col space-y-2">
              <Link 
                href="/clubSearch" 
                onClick={closeMobileMenu}
                className={`transition-colors py-2 px-3 rounded-md ${
                  isActive('/clubSearch') 
                    ? 'text-[#1E3765] bg-blue-50 font-medium' 
                    : 'text-gray-700 hover:text-[#6FC7EA] hover:bg-gray-50'
                }`}
              >
                Clubs
              </Link>
              <Link 
                href="/postFilter" 
                onClick={closeMobileMenu}
                className={`transition-colors py-2 px-3 rounded-md ${
                  isActive('/postFilter') 
                    ? 'text-[#1E3765] bg-blue-50 font-medium' 
                    : 'text-gray-700 hover:text-[#6FC7EA] hover:bg-gray-50'
                }`}
              >
                Posts
              </Link>
              <Link 
                href="/pending-club-request" 
                onClick={closeMobileMenu}
                className={`transition-colors py-2 px-3 rounded-md ${
                  isActive('/pending-club-request') 
                    ? 'text-[#1E3765] bg-blue-50 font-medium' 
                    : 'text-gray-700 hover:text-[#6FC7EA] hover:bg-gray-50'
                }`}
              >
                Request Club
              </Link>
            </div>

            {/* Mobile User Info */}
            {!loading && user && (
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{user.email}</span>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/profile" 
                    onClick={closeMobileMenu}
                    className={`px-3 py-2 rounded-md font-medium transition-colors duration-150 ease-in-out text-center ${
                      isActive('/profile') 
                        ? 'bg-[#1E3765] text-white' 
                        : 'bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700'
                    }`}
                  >
                    Profile
                  </Link>
                  {userData?.is_admin && (
                    <Link 
                      href="/admin" 
                      onClick={closeMobileMenu}
                      className={`px-3 py-2 rounded-md font-medium transition-colors duration-150 ease-in-out text-center ${
                        isActive('/admin') 
                          ? 'bg-[#1E3765] text-white' 
                          : 'bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                  {(userData?.is_executive || userData?.is_admin) && (
                    <Link 
                      href="/exec" 
                      onClick={closeMobileMenu}
                      className={`px-3 py-2 rounded-md font-medium transition-colors duration-150 ease-in-out text-center ${
                        isActive('/exec') 
                          ? 'bg-[#1E3765] text-white' 
                          : 'bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700'
                      }`}
                    >
                      Exec
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md font-semibold transition-colors duration-150 ease-in-out w-full"
                  >   
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* Loading State for Mobile */}
            {loading && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-500 text-center">Loading...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
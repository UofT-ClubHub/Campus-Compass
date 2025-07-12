"use client"

import Link from "next/link"
import { auth } from '@/model/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
          <Link href="/" className="text-lg font-semibold text-[#1E3765] hover:text-[#6FC7EA] transition-colors">Campus Compass</Link> 
          <div className="hidden md:flex items-center gap-3 sm:gap-5">
            <Link href="/clubSearch" className="text-gray-700 hover:text-[#6FC7EA] transition-colors">Clubs</Link>
            <Link href="/postFilter" className="text-gray-700 hover:text-[#6FC7EA] transition-colors">Posts</Link>
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
                className="bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors duration-150 ease-in-out"
              >
                Profile
              </Link>
              <Link 
                href="/admin" 
                className="bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors duration-150 ease-in-out"
              >
                Admin
              </Link>
              <Link 
                href="/exec" 
                className="bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors duration-150 ease-in-out"
              >
                Exec
              </Link>
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
                className="text-gray-700 hover:text-[#6FC7EA] transition-colors py-2 px-3 rounded-md hover:bg-gray-50"
              >
                Clubs
              </Link>
              <Link 
                href="/postFilter" 
                onClick={closeMobileMenu}
                className="text-gray-700 hover:text-[#6FC7EA] transition-colors py-2 px-3 rounded-md hover:bg-gray-50"
              >
                Posts
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
                    className="bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700 px-3 py-2 rounded-md font-medium transition-colors duration-150 ease-in-out text-center"
                  >
                    Profile
                  </Link>
                  <Link 
                    href="/admin" 
                    onClick={closeMobileMenu}
                    className="bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700 px-3 py-2 rounded-md font-medium transition-colors duration-150 ease-in-out text-center"
                  >
                    Admin
                  </Link>
                  <Link 
                    href="/exec" 
                    onClick={closeMobileMenu}
                    className="bg-gray-100 hover:bg-[#6FC7EA] hover:text-white text-gray-700 px-3 py-2 rounded-md font-medium transition-colors duration-150 ease-in-out text-center"
                  >
                    Exec
                  </Link>
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
"use client"

import Link from "next/link"
import { useAuth } from '@/hooks/useAuth';
import firebase from '@/model/firebase';
import { useRouter } from 'next/navigation';

export function Header() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await firebase.auth().signOut();
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container flex h-16 items-center justify-between mx-auto px-5">

        <nav className="flex items-center gap-5">
          <Link href="/" className="text-lg font-semibold text-[#1E3765] hover:text-[#6FC7EA] transition-colors">Campus Compass</Link> 
          <Link href="/clubSearch" className="text-gray-700 hover:text-[#6FC7EA] transition-colors">Clubs</Link>
          <Link href="/postFilter" className="text-gray-700 hover:text-[#6FC7EA] transition-colors">Posts</Link>
        </nav>
        <nav className="flex items-center gap-4">
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
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full hidden sm:flex">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">{user.email}</span>
              </div>
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
      </div>
    </header>
  )
}
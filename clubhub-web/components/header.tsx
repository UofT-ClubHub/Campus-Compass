"use client"

import Link from "next/link"

export function Header() {
    return (
    <header className="sticky">
      <div className="container flex h-15 items-center justify-between mx-auto px-5">

        <nav className="flex items-center gap-5">
          <Link href="/" className="text-lg font-semibold">Campus Compass</Link> 
          <Link href="/clubs" className="">Clubs</Link>
          <Link href="/clubs" className="">Events</Link>
        </nav>
        <nav className="flex items-center gap-5">
          <button className="bg-[#6FC7EA] text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">   
              <Link href="/clubs" className="">Login</Link>
          </button>
          <button className="bg-[#1E3765] text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">   
              <Link href="/clubs" className="">Register</Link>
          </button>
        </nav>
      </div>
    </header>
  )
}
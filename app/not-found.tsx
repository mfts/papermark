'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Home, Book, Users } from 'lucide-react'

export default function NotFound({ message }: { message?: string }) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality here
    // console.log('Searching for:', searchQuery)
  }

  const paperVariants = {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <motion.div
        className="w-64 h-64 mb-8"
        initial="initial"
        animate="animate"
        variants={paperVariants}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <motion.path
            d="M10 10 L90 10 L90 90 L10 90 Z"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M20 30 L80 30 M20 50 L80 50 M20 70 L60 70"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
          />
        </svg>
      </motion.div>

      <h1 className="text-5xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-8">Page Not Found</h2>

      <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Papermark.io"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-full border-2 border-blue-300 focus:outline-none focus:border-blue-500 pr-10"
          />
          <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Search className="text-blue-500 w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/welcome" className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <Home className="text-blue-500 w-6 h-6 mr-3" />
          <span className="text-gray-800">Home</span>
        </Link>
        <Link href="/documents" className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <Book className="text-blue-500 w-6 h-6 mr-3" />
          <span className="text-gray-800">Documents</span>
        </Link>
        <Link href="/settings/general" className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <Users className="text-blue-500 w-6 h-6 mr-3" />
          <span className="text-gray-800">Settings</span>
        </Link>
      </div>

      <p className="text-center text-gray-600 max-w-md">
      {message ||
                  "Sorry, we couldn’t find the page you’re looking for."}
      </p>

      <footer className="mt-16 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Papermark.io. All rights reserved.</p>
      </footer>
    </div>
  )
}
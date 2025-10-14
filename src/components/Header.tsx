'use client';

import { Mountain, MessageCircle, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Mountain className="h-6 w-6 sm:h-8 sm:w-8 text-terrace-600" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Terrace AI</h1>
                <p className="text-xs sm:text-sm text-gray-600">Your Local Assistant</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile: Icon only */}
            <Link 
              href="/business/claim"
              className="flex items-center space-x-2 px-3 py-2 sm:px-4 bg-terrace-600 text-white rounded-lg hover:bg-terrace-700 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">For Businesses</span>
            </Link>
            
            <Link 
              href="/business/verify"
              className="hidden sm:block text-sm text-gray-600 hover:text-terrace-600 transition-colors"
            >
              Check Status
            </Link>
            
            {/* Hide on mobile */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <MessageCircle className="h-4 w-4" />
              <span>Powered by Weaviate RAG</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}






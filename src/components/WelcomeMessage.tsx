'use client';

import { MessageCircle, MapPin, Building2, Users } from 'lucide-react';

interface WelcomeMessageProps {
  onStartChat: () => void;
}

export default function WelcomeMessage({ onStartChat }: WelcomeMessageProps) {
  return (
    <div className="text-center space-y-12 animate-fade-in max-w-5xl mx-auto px-4">
      {/* Hero Section - Apple/Google inspired */}
      <div className="space-y-6 pt-12">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-terrace-500/20 to-mountain-500/20 blur-3xl rounded-full"></div>
            <div className="relative p-5 bg-gradient-to-br from-terrace-500 to-mountain-600 rounded-3xl shadow-2xl">
              <MessageCircle className="h-14 w-14 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-semibold text-gray-900 tracking-tight">
          Terrace AI
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
          Your intelligent assistant for discovering local businesses and accessing municipal information in Terrace, BC.
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>1,127 Businesses</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>308 Documents</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Instant Answers</span>
          </div>
        </div>
      </div>

      {/* Features Grid - Minimal Apple/Google style */}
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="group bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 hover:border-gray-300/80 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
          <div className="w-12 h-12 bg-gradient-to-br from-terrace-500 to-terrace-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <Building2 className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Business Directory</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Discover restaurants, services, and local businesses with complete information and locations.
          </p>
        </div>
        
        <div className="group bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 hover:border-gray-300/80 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <MapPin className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Municipal Services</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Access bylaws, permits, and regulations with instant answers from official documents.
          </p>
        </div>
        
        <div className="group bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 hover:border-gray-300/80 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <Users className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Intelligent Search</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Multi-stage AI pipeline understands your questions and delivers precise answers.
          </p>
        </div>
      </div>

      {/* Example Queries - ChatGPT inspired */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Examples</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <button
            onClick={onStartChat}
            className="group text-left bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/60 hover:border-terrace-400 hover:shadow-lg transition-all duration-300"
          >
            <div className="text-xs font-medium text-terrace-600 mb-2 group-hover:text-terrace-700">Business Search</div>
            <div className="text-sm text-gray-700 group-hover:text-gray-900">"Find HVAC contractors in Terrace"</div>
          </button>
          <button
            onClick={onStartChat}
            className="group text-left bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/60 hover:border-blue-400 hover:shadow-lg transition-all duration-300"
          >
            <div className="text-xs font-medium text-blue-600 mb-2 group-hover:text-blue-700">Bylaws & Regulations</div>
            <div className="text-sm text-gray-700 group-hover:text-gray-900">"What are the noise bylaws?"</div>
          </button>
          <button
            onClick={onStartChat}
            className="group text-left bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/60 hover:border-purple-400 hover:shadow-lg transition-all duration-300"
          >
            <div className="text-xs font-medium text-purple-600 mb-2 group-hover:text-purple-700">Permits & Licenses</div>
            <div className="text-sm text-gray-700 group-hover:text-gray-900">"How do I get a dog license?"</div>
          </button>
          <button
            onClick={onStartChat}
            className="group text-left bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/60 hover:border-green-400 hover:shadow-lg transition-all duration-300"
          >
            <div className="text-xs font-medium text-green-600 mb-2 group-hover:text-green-700">Multi-Question</div>
            <div className="text-sm text-gray-700 group-hover:text-gray-900">"Find restaurants and what are property taxes?"</div>
          </button>
        </div>
      </div>

      {/* Start Chat Button - Premium styling */}
      <div className="pt-8">
        <button
          onClick={onStartChat}
          className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-terrace-600 to-mountain-600 text-white px-10 py-4 rounded-full font-medium text-base hover:shadow-2xl hover:shadow-terrace-500/30 transform hover:scale-105 transition-all duration-300 shadow-xl"
        >
          <MessageCircle className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" strokeWidth={2} />
          <span>Start Chatting</span>
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>

      {/* Footer - Minimalist */}
      <div className="text-xs text-gray-400 pt-12 flex items-center justify-center gap-2">
        <span>Powered by</span>
        <span className="font-medium text-gray-600">Groq</span>
        <span>•</span>
        <span className="font-medium text-gray-600">xAI</span>
        <span>•</span>
        <span className="font-medium text-gray-600">Weaviate</span>
      </div>
    </div>
  );
}








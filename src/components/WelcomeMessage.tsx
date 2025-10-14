'use client';

import { MessageCircle, MapPin, Building2, Users } from 'lucide-react';

interface WelcomeMessageProps {
  onStartChat: () => void;
}

export default function WelcomeMessage({ onStartChat }: WelcomeMessageProps) {
  return (
    <div className="text-center space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-terrace rounded-full">
            <MessageCircle className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          Welcome to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-terrace-600 to-mountain-600">
            Terrace AI
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your intelligent assistant for Terrace, BC business and community information. 
          Powered by Llama 3.1 and Weaviate RAG technology.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
          <Building2 className="h-8 w-8 text-terrace-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Directory</h3>
          <p className="text-gray-600">
            Find restaurants, services, and businesses in Terrace with detailed information and locations.
          </p>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
          <MapPin className="h-8 w-8 text-terrace-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Information</h3>
          <p className="text-gray-600">
            Get answers about Terrace's community services, events, and local amenities.
          </p>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
          <Users className="h-8 w-8 text-terrace-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Assistant</h3>
          <p className="text-gray-600">
            Ask questions naturally and get intelligent responses powered by Llama 3.1 AI.
          </p>
        </div>
      </div>

      {/* Example Queries */}
      <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Try asking:</h3>
        <div className="space-y-2 text-left">
          <div className="bg-white/60 rounded-lg p-3 text-sm">
            "Where can I find a good restaurant in Terrace?"
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-sm">
            "What automotive services are available?"
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-sm">
            "Tell me about healthcare services in Terrace"
          </div>
        </div>
      </div>

      {/* Start Chat Button */}
      <div className="pt-4">
        <button
          onClick={onStartChat}
          className="bg-gradient-terrace text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 btn-hover"
        >
          Start Chatting with Terrace AI
        </button>
      </div>

      {/* Footer */}
      <div className="text-sm text-gray-500 pt-8">
        <p>Powered by Llama 3.1 8B Instruct • Weaviate Vector Database • Terrace AI Dataset</p>
      </div>
    </div>
  );
}








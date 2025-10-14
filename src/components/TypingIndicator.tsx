'use client';

import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-slide-up">
      <div className="flex items-start space-x-3 max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-terrace text-white">
          <Bot className="h-4 w-4" />
        </div>

        {/* Typing Indicator */}
        <div className="flex flex-col items-start">
          <div className="bg-white/90 backdrop-blur-sm text-gray-900 rounded-2xl rounded-bl-md border border-gray-200 px-4 py-3">
            <div className="typing-indicator">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}








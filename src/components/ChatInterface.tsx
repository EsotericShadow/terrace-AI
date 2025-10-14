'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface Business {
  name: string;
  category: string;
  address: string;
  phone: string;
  description: string;
  score: number;
  claimed?: boolean;
  verified?: boolean;
}

interface Document {
  title: string;
  category: string;
  summary: string;
  fullContent?: string;
  score: number;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  businesses?: Business[];
  documents?: Document[];
  confidence?: 'high' | 'medium' | 'low';
  sources?: number;
}

// Land acknowledgement variations - respectfully honoring Indigenous territories
const LAND_ACKNOWLEDGEMENTS = [
  "I acknowledge that it is an honour to live and work on the Laxyuubm Tsimshian, Kitsumkalum and Kitselas, toyaxsuut nuusm.",
  "I acknowledge with respect that we gather on the traditional, ancestral, and unceded territories of the Tsimshian Nation, specifically the Kitselas and Kitsumkalum peoples, who have stewarded this land since time immemorial.",
  "I am grateful to live and work on the unceded territories of the Kitselas and Kitsumkalum peoples of the Tsimshian Nation, whose deep connection to this land continues to shape our community.",
  "I honour the Kitselas and Kitsumkalum peoples of the Tsimshian Nation, on whose traditional and unceded territories we gather, recognizing their rich cultural heritage and enduring presence.",
  "I acknowledge that Terrace is situated on the ancestral lands of the Tsimshian Nation, specifically the Kitselas and Kitsumkalum peoples, and commit to learning from their wisdom and stewardship.",
  "I respectfully acknowledge the Kitselas and Kitsumkalum peoples as the original caretakers of these lands, and honour their millennia of stewardship of the territory we now call Terrace.",
  "I acknowledge with humility that we are on the unceded territories of the Tsimshian Nation, where Kitselas and Kitsumkalum peoples have lived, thrived, and governed for thousands of years.",
  "I recognize that we live and work on the traditional territories of the Kitselas and Kitsumkalum peoples of the Tsimshian Nation, and honor their ongoing relationship with this land.",
  "I acknowledge the Kitselas and Kitsumkalum peoples of the Tsimshian Nation, on whose unceded territories Terrace stands, and whose cultural practices continue to enrich this region.",
  "I honour the Kitselas and Kitsumkalum peoples of the Tsimshian Nation, the traditional stewards of this land."
];

export default function ChatInterface() {
  // Select a random land acknowledgement for this session
  const [landAcknowledgement] = useState(() => {
    const randomIndex = Math.floor(Math.random() * LAND_ACKNOWLEDGEMENTS.length);
    return LAND_ACKNOWLEDGEMENTS[randomIndex];
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm Terrace AI, your intelligent assistant for Terrace, BC. I can help you find local businesses, explore cultural heritage and history, answer questions about municipal services, bylaws, permits, and more.\n\n${landAcknowledgement}`,
      sender: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    // Generate session ID on component mount
    if (typeof window !== 'undefined' && window.crypto) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        sender: 'assistant',
        timestamp: new Date(),
        businesses: data.businesses,
        documents: data.documents,
        confidence: data.confidence,
        sources: data.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-160px)]">
      {/* Messages Container - Mobile optimized */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container - Mobile-first */}
      <div className="border-t border-gray-200/50 bg-white/70 backdrop-blur-2xl p-3 sm:p-6 safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="flex items-end gap-2 sm:gap-3 bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 p-1.5 sm:p-2 focus-within:ring-2 focus-within:ring-terrace-500/30 focus-within:border-terrace-400 focus-within:shadow-2xl transition-all duration-300">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask anything about Terrace..."
                className="flex-1 px-3 sm:px-5 py-3 sm:py-4 bg-transparent focus:outline-none resize-none text-gray-900 placeholder:text-gray-400 text-base leading-normal"
                rows={1}
                disabled={isLoading}
                style={{
                  minHeight: '48px',
                  maxHeight: '200px',
                  fontSize: '16px',
                }}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="flex-shrink-0 w-12 h-12 sm:w-11 sm:h-11 bg-gradient-to-br from-terrace-600 to-mountain-600 text-white rounded-xl sm:rounded-2xl hover:shadow-lg hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Send className="h-5 w-5" strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mt-2 sm:mt-4 text-center flex items-center justify-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-terrace-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="font-medium text-gray-500">{isLoading ? 'Thinking' : 'Ready'}</span>
            </div>
            {messages.length > 1 && (
              <>
                <span className="text-gray-300">•</span>
                <span className="hidden sm:inline">{messages.length - 1} {messages.length === 2 ? 'exchange' : 'exchanges'}</span>
                <span className="sm:hidden">{messages.length - 1}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}








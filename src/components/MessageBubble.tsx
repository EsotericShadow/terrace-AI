'use client';

import { Bot, User, MapPin, Building2, Phone, FileText, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-terrace-600 text-white' 
            : 'bg-gradient-terrace text-white'
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-terrace-600 text-white rounded-br-md'
              : 'bg-white/90 backdrop-blur-sm text-gray-900 rounded-bl-md border border-gray-200'
          }`}>
            <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
              isUser ? 'prose-invert' : ''
            }`}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({node, ...props}) => <ul className="mb-2 ml-4 list-disc" {...props} />,
                  ol: ({node, ...props}) => <ol className="mb-2 ml-4 list-decimal" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </div>

          {/* Confidence Badge */}
          {message.confidence && message.sender === 'assistant' && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                message.confidence === 'high' 
                  ? 'bg-green-100 text-green-800'
                  : message.confidence === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {message.confidence === 'high' && '✓ High confidence'}
                {message.confidence === 'medium' && '~ Medium confidence'}
                {message.confidence === 'low' && '? Low confidence'}
                {message.sources && ` • ${message.sources} source${message.sources > 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          {/* Business Results */}
          {message.businesses && message.businesses.length > 0 && (
            <div className="mt-3 w-full max-w-2xl">
              <div className="bg-gradient-to-br from-terrace-50 to-green-50 rounded-lg p-4 border border-terrace-200">
                <div className="text-sm font-semibold text-terrace-800 mb-3 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Recommended Businesses
                </div>
                <div className="space-y-3">
                  {message.businesses.slice(0, 1).map((business, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="font-medium text-gray-900 text-sm">{business.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{business.category}</div>
                      {business.address && (
                        <div className="text-xs text-gray-700 flex items-center mt-2">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          {business.address}
                        </div>
                      )}
                      {business.phone && (
                        <div className="text-xs text-terrace-600 flex items-center mt-1">
                          <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                          {business.phone}
                        </div>
                      )}
                      {business.description && (
                        <div className="text-xs text-gray-600 mt-2 italic">
                          {business.description.substring(0, 120)}
                          {business.description.length > 120 && '...'}
                        </div>
                      )}
                      {/* Own This Business Link - Only show for unclaimed businesses */}
                      {!business.claimed && !business.verified && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <a 
                            href={`/business/claim?business=${encodeURIComponent(business.name)}&address=${encodeURIComponent(business.address || '')}`}
                            className="text-xs text-terrace-600 hover:text-terrace-800 hover:underline font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Own this business?
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Document Results */}
          {message.documents && message.documents.length > 0 && (
            <div className="mt-3 w-full max-w-2xl">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Relevant Documents
                </div>
                <div className="space-y-3">
                  {message.documents.slice(0, 1).map((doc, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="font-medium text-gray-900 text-sm">{doc.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{doc.category}</div>
                      <div className="text-xs text-gray-700 mt-2 leading-relaxed">
                        {doc.summary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








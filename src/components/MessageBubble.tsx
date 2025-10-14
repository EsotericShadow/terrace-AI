'use client';

import { Bot, User, MapPin, Building2, Phone, FileText, AlertCircle, Flag } from 'lucide-react';
import { useState } from 'react';
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correction' | 'addition' | 'wrong' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.content,
          feedbackType,
          feedbackText,
          businesses: message.businesses?.map(b => b.name) || [],
          documents: message.documents?.map(d => d.title) || [],
          timestamp: new Date().toISOString()
        })
      });
      
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
        setFeedbackText('');
        setFeedbackType(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
      <div className={`flex items-start space-x-2 sm:space-x-3 max-w-[95%] sm:max-w-[85%] md:max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar - Smaller on mobile */}
        <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-terrace-600 text-white' 
            : 'bg-gradient-terrace text-white'
        }`}>
          {isUser ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} relative`}>
          {/* Feedback Flag Button (desktop only) */}
          {!isUser && (
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="hidden md:block absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1.5 shadow-md hover:shadow-lg border border-gray-200 z-10"
              title="Report an issue or suggest improvement"
            >
              <Flag className="h-3.5 w-3.5 text-gray-600 hover:text-terrace-600" />
            </button>
          )}

          <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl break-words overflow-hidden ${
            isUser
              ? 'bg-terrace-600 text-white rounded-br-md'
              : 'bg-white/90 backdrop-blur-sm text-gray-900 rounded-bl-md border border-gray-200'
          }`}>
            <div className={`text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none break-words ${
              isUser ? 'prose-invert' : ''
            }`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0 break-words" {...props} />,
                  ul: ({node, ...props}) => <ul className="mb-2 ml-4 list-disc break-words" {...props} />,
                  ol: ({node, ...props}) => <ol className="mb-2 ml-4 list-decimal break-words" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1 break-words" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold break-words" {...props} />,
                  em: ({node, ...props}) => <em className="italic break-words" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs break-all" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1" {...props} />,
                  a: ({node, href, children, ...props}) => {
                    // Style terrace.ca document links as premium buttons
                    const isTerraceDocs = href?.includes('terrace.ca/media');
                    if (isTerraceDocs) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 mt-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-xs sm:text-sm no-underline hover:scale-105 min-h-[44px]"
                          {...props}
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="flex-1 break-words">{children}</span>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      );
                    }
                    // Regular links
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-words"
                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
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

          {/* Feedback Form */}
          {showFeedback && !isUser && (
            <div className="mt-3 w-full max-w-2xl bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
              {feedbackSubmitted ? (
                <div className="text-sm text-green-600 font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Thank you! Your feedback helps us improve.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">
                    Help us improve! What's wrong or missing?
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setFeedbackType('wrong')}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        feedbackType === 'wrong'
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-red-300'
                      }`}
                    >
                      Incorrect Info
                    </button>
                    <button
                      onClick={() => setFeedbackType('addition')}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        feedbackType === 'addition'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      Missing Info
                    </button>
                    <button
                      onClick={() => setFeedbackType('correction')}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        feedbackType === 'correction'
                          ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-yellow-300'
                      }`}
                    >
                      Needs Update
                    </button>
                  </div>

                  {feedbackType && (
                    <>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={
                          feedbackType === 'wrong'
                            ? "What information is incorrect? Please be specific..."
                            : feedbackType === 'addition'
                            ? "What information is missing? (e.g., phone number, hours, services...)"
                            : "What needs to be updated?"
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-terrace-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSubmitFeedback}
                          disabled={!feedbackText.trim()}
                          className="px-4 py-2 text-sm bg-terrace-600 text-white rounded-lg hover:bg-terrace-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Submit Feedback
                        </button>
                        <button
                          onClick={() => {
                            setShowFeedback(false);
                            setFeedbackType(null);
                            setFeedbackText('');
                          }}
                          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








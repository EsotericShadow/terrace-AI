'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import Header from '@/components/Header';
import WelcomeMessage from '@/components/WelcomeMessage';

export default function Home() {
  const [isChatStarted, setIsChatStarted] = useState(false);

  const handleStartChat = () => {
    setIsChatStarted(true);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {!isChatStarted ? (
          <div className="max-w-4xl w-full text-center">
            <WelcomeMessage onStartChat={handleStartChat} />
          </div>
        ) : (
          <div className="max-w-4xl w-full h-full flex flex-col">
            <ChatInterface />
          </div>
        )}
      </div>
    </main>
  );
}








'use client';

import { useState, useRef, useEffect, useMemo, ReactNode } from 'react';
import { ChatMessage, WineReference } from '@/lib/types';
import { getAddedWines } from '@/lib/userData';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onWineClick?: (wineId: string) => void;
}

// Parse message content and convert [[Name|id]] to clickable elements
function parseMessageContent(
  content: string, 
  onWineClick?: (wineId: string) => void
): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    // Add the wine link
    const displayName = match[1];
    const wineId = match[2];
    parts.push(
      <button
        key={key++}
        onClick={() => onWineClick?.(wineId)}
        className="text-wine-red hover:text-wine-red-dark underline decoration-dotted underline-offset-2 font-medium transition-colors"
        title="Click to view this wine"
      >
        {displayName}
      </button>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [content];
}

export function ChatWidget({ isOpen, onClose, onWineClick }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Include user-added wines so the AI knows about them
      const userAddedWines = getAddedWines();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          userAddedWines: userAddedWines.map(w => ({
            producer: w.producer,
            name: w.name,
            vintage: w.vintage,
            region: w.region,
            country: w.country,
            wineType: w.wineType,
            grapeVarieties: w.grapeVarieties,
            drinkWindowStart: w.drinkWindowStart,
            drinkWindowEnd: w.drinkWindowEnd,
            tastingNotes: w.tastingNotes,
            foodPairings: w.foodPairings,
            body: w.body,
            quantity: w.quantity,
          }))
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${data.error}` 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble connecting. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:inset-auto md:bottom-4 md:right-4 md:w-96 md:h-[600px] bg-white md:rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-wine-red to-wine-red-dark text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Wine Sommelier</h3>
          <p className="text-xs opacity-80">Ask about your collection</p>
        </div>
        <button 
          onClick={onClose}
          className="text-2xl hover:opacity-80"
          aria-label="Close chat"
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">Hello! I&apos;m your wine sommelier.</p>
            <p className="text-sm">Ask me about food pairings, recommendations, or anything about your wine collection.</p>
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => setInput('What wines pair well with steak?')}
                className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm hover:bg-gray-100"
              >
                &quot;What wines pair well with steak?&quot;
              </button>
              <button 
                onClick={() => setInput('Which wines should I drink soon?')}
                className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm hover:bg-gray-100"
              >
                &quot;Which wines should I drink soon?&quot;
              </button>
              <button 
                onClick={() => setInput('Tell me about my Italian wines')}
                className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm hover:bg-gray-100"
              >
                &quot;Tell me about my Italian wines&quot;
              </button>
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-wine-red text-white'
                  : 'bg-white shadow'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">
                {msg.role === 'assistant' 
                  ? parseMessageContent(msg.content, onWineClick)
                  : msg.content
                }
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white shadow rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your wines..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-wine-red text-white rounded-lg hover:bg-wine-red-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

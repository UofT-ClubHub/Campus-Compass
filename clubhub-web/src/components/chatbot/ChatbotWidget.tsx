"use client";

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/model/firebase';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  data?: any;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize with welcome message for everyone
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        content: "Hi! 👋 I'm ClubHub Assistant! I can help you discover clubs, events, and posts at UofT across all three campuses. What would you like to explore?",
        isUser: false,
        timestamp: new Date(),
        data: { greeting: true }
      }]);
    }
  }, [messages.length]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get Firebase ID token
      const token = await user?.getIdToken();
      // Call API with authentication
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message })
      });

      const result = await response.json();

      if (result.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result.message,
          isUser: false,
          timestamp: new Date(),
          data: result.data
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(result.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble right now. Please try again or explore ClubHub to learn more!",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  // Show widget for EVERYONE - no authentication required!
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
          style={{
            background: `linear-gradient(to right, var(--primary), var(--accent))`,
            color: 'var(--primary-foreground)'
          }}
        >
          <MessageCircle size={28} className="transition-transform group-hover:scale-110" />
          
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--destructive)' }}></div>
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 text-sm py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
               style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}>
            Chat with ClubHub Assistant
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent" style={{ borderLeftColor: 'var(--foreground)' }}></div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg sm:w-[28rem] sm:max-w-xl w-[95vw] h-[80vh] max-h-[700px] flex flex-col border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">ClubHub Assistant</h3>
                <p className="text-sm opacity-80">Online • Ready to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-primary-foreground/20 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* If not authenticated, show login prompt */}
          {!user ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Bot size={40} className="mb-4 text-accent" />
              <p className="text-muted-foreground mb-4">Please login to chat with the ClubHub Assistant and discover clubs, events, and more!</p>
              <button
                onClick={() => window.location.href = '/auth'}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              {/* Messages Container - Fixed scrollbar spacing */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/50 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.isUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-accent text-accent-foreground'
                    }`}>
                      {message.isUser ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    {/* Message Bubble - Fixed max width to account for scrollbar */}
                    <div className={`max-w-[280px] px-4 py-3 rounded-2xl ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card text-card-foreground border border-border rounded-bl-md shadow-sm'
                    }`}>
                      {message.isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <ReactMarkdown components={{
                          p: (props) => <p className="text-sm leading-relaxed whitespace-pre-wrap" {...props} />
                        }}>{message.content}</ReactMarkdown>
                      )}
                      {/* Timestamp */}
                      <p className={`text-xs mt-2 ${
                        message.isUser ? 'opacity-80' : 'text-muted-foreground'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="bg-card text-card-foreground border border-border px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Input Area - Fixed layout to prevent send button overlap */}
              <div className="p-4 bg-background border-t border-border flex-shrink-0">
                {/* Input Container */}
                <div className="flex items-end gap-3 mb-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about clubs, events, etc."
                      className="w-full border border-border rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none min-h-[48px] max-h-24 text-sm bg-input text-foreground"
                      disabled={isLoading}
                      rows={1}
                      style={{ 
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--border) transparent'
                      }}
                    />
                    {/* Send Button - Fixed positioning */}
                    <button
                      onClick={() => sendMessage(inputMessage)}
                      disabled={isLoading || !inputMessage.trim()}
                      className="absolute right-3 bottom-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground disabled:text-muted-foreground rounded-lg p-2 transition-all duration-200 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => sendMessage("What clubs are available at UofT?")}
                    className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors flex-shrink-0"
                    disabled={isLoading}
                  >
                    Find Clubs
                  </button>
                  <button
                    onClick={() => sendMessage("What events are happening this week?")}
                    className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors flex-shrink-0"
                    disabled={isLoading}
                  >
                    Upcoming Events
                  </button>
                  <button
                    onClick={() => sendMessage("Tell me about ClubHub")}
                    className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors flex-shrink-0"
                    disabled={isLoading}
                  >
                    About ClubHub
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
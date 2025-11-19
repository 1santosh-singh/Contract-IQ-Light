"use client"

import { useState, useEffect, useRef } from "react"
import ReactMarkdown from 'react-markdown'
import { MessageCircle, Send, Bot, X, Minus, Maximize2, Upload, Loader2 } from "lucide-react"
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "./navbar"

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
  openChat?: boolean
  onCloseChat?: () => void
}

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export function MainLayout({ children, className, openChat, onCloseChat }: MainLayoutProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [chatState, setChatState] = useState<'minimized' | 'normal' | 'maximized'>('minimized')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [textareaHeight, setTextareaHeight] = useState(40) // Initial height in px (approx for rows=1)
  const [user, setUser] = useState<User | null>(null)
  const isMaximized = chatState === 'maximized'
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset to recalculate
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.max(40, Math.min(scrollHeight, 120)); // Min 40px, max 120px
      setTextareaHeight(newHeight);
    }
  }, [inputValue]);

  const supabase = createClient()

  const initialMessages: Message[] = []

  useEffect(() => {
    setMounted(true)
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Load persistent messages
  useEffect(() => {
    const saved = localStorage.getItem('chatMessages')
    if (saved) {
      setMessages(JSON.parse(saved))
    } else {
      setMessages(initialMessages)
    }
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages))
  }, [messages])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const handleSend = async () => {
    const text = inputValue
    if (!text?.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInputValue('')
    setIsTyping(true)

    // Construct full messages for API including the new user message and system prompt
    const systemMessage = {
      role: 'system' as const,
      content: `You are Contract IQ, a helpful AI assistant specialized in contract analysis, summaries, and clause explanations. Always respond in clear, professional Markdown format. Use bullet points for lists (e.g., key clauses, risks, deadlines). Use bold for important terms. Keep responses concise yet informative. Focus on legal insights without giving formal advice.`
    };
    const apiMessages = [systemMessage, ...messages, { role: 'user', content: text }].map(m => ({
      role: m.role === 'bot' ? 'assistant' : m.role,
      content: m.content
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API error:', errorText);
        throw new Error(`Chat request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Chat response data:', data);
      let botMessage = data.message || data.response || 'Sorry, I could not generate a response.';
      // Remove leading/trailing brackets if present
      botMessage = botMessage.replace(/^\[|\]$/g, '');
      console.log('Bot message:', botMessage);
      setMessages(prev => [...prev, { role: 'bot', content: botMessage }]);
      console.log('Messages after update:', [...messages, { role: 'bot', content: botMessage }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setMessages(prev => [...prev, { role: 'bot', content: `Sorry, there was an error: ${errorMsg}. Please try again.` }]);
    } finally {
      setIsTyping(false);
    }
  }


  useEffect(() => {
    if (chatState !== 'minimized' && messages.length === 0) {
      setIsTyping(true)
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', content: 'How can I help you?' }])
        setIsTyping(false)
      }, 1000)
    }
  }, [chatState, messages.length])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
  }, [])

  useEffect(() => {
    if (openChat) {
      setChatState('maximized')
      onCloseChat && onCloseChat()
    }
  }, [openChat, onCloseChat])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      <Navbar onToggleTheme={toggleTheme} isDark={isDark} />
      <main
        className={`flex-1 ${className || ""} ${isMaximized ? 'blur-sm' : ''}`}
      >
        {children}
      </main>

      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => {
          setChatState('normal')
        }}
        className={`fixed bottom-6 right-6 h-14 w-14 md:h-16 md:w-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl z-[9999] transition-all duration-300 ease-out ${chatState !== 'minimized' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'} flex items-center justify-center`}
      >
          <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-white" />
        </Button>

      {/* Floating Chatbot Window */}
      <div className={`fixed z-50 transition-all duration-300 ease-out transform origin-bottom-right ${
        chatState === 'maximized'
          ? 'top-0 left-0 w-full h-full sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[70vw] sm:h-[80vh] bg-white dark:bg-gray-900 border border-border rounded-lg shadow-2xl'
          : 'bottom-0 right-0 w-full h-[55vh] sm:bottom-4 sm:right-4 sm:w-96 sm:max-h-[85vh]'
      } ${chatState === 'minimized' ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'} ${chatState === 'maximized' ? '' : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl border-white/20 dark:border-gray-700/30 rounded-2xl shadow-2xl'} overflow-hidden`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Contract IQ Assistant</h3>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatState(chatState === 'maximized' ? 'normal' : 'maximized')}
                  className="h-6 w-6 p-0 rounded-md hover:bg-gray-400/50 dark:hover:bg-white/10"
                >
                  <Maximize2 className="h-3 w-3 text-gray-800 dark:text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatState('minimized')}
                  className="h-6 w-6 p-0 rounded-md hover:bg-gray-400/50 dark:hover:bg-white/10"
                >
                  <X className="h-3 w-3 text-gray-800 dark:text-white" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages">
              {messages.length === 0 && !isTyping && (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-gray-400" />
                  <p className="text-lg text-foreground dark:text-white">How can I help you today?</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex flex-col ${msg.role === 'bot' ? 'items-start' : 'items-end'} max-w-[70%]`}>
                    <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed prose prose-sm max-w-none ${msg.role === 'bot' ? 'bg-blue-50 dark:bg-blue-950 text-gray-800 dark:text-white rounded-br-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'}`}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 last:mb-0 list-disc list-inside ml-4">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 last:mb-0 list-decimal list-inside ml-4">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-xs">{children}</code>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex flex-col items-start max-w-[70%]">
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 text-gray-800 dark:text-white rounded-2xl rounded-br-md shadow-sm">
                      <div className="flex items-center gap-1 h-4">
                        <div className="typing-dots">
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className={`px-4 py-2 border-t ${chatState === 'maximized' ? 'border-border bg-white dark:bg-gray-900' : 'border-white/20 dark:border-gray-700/30 bg-white/5 dark:bg-gray-800/50 backdrop-blur-md'}`}>
              <div className="flex items-stretch gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about contracts..."
                  className={`flex-1 transition-all duration-200 ease-in-out ${chatState === 'maximized' ? 'bg-muted/20 dark:bg-gray-800/30 border-border' : 'bg-white/20 dark:bg-gray-800/70 backdrop-blur-md border border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-400 resize-none`}
                  style={{ height: textareaHeight }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg h-16 w-16 overflow-hidden flex items-center justify-center"
                >
                  {isTyping ? <Loader2 className="h-14 w-14 animate-spin" /> : <Send className="h-14 w-14" />}
                </Button>
              </div>

            </div>
          </div>
        </div>

    </div>
  )
}

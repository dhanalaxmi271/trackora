import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, User, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

// Initialize Gemini API using the modern SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatbot() {
  const { profile, role: userRole } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Hello! I'm your Pathmark AI Assistant. How can I help you today? You can ask about student progress, platform features, or ways to improve student engagement.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const context = `You are a helpful AI Assistant for Pathmark, an education tracking platform for engineering colleges. 
      The current user is a ${userRole} named ${profile?.name || 'User'}. 
      You have access to data about students across branches (CSE, ECE, MECH, etc.) and years (1st to 4th).
      Your goal is to help analyzed student progress, identify weak students in specific subjects (like DSA, DBMS, OS), 
      and provide educational insights based on branches and years.
      
      When asked about "weak students", look for those with scores below 50% or low proficiency in the relevant category.
      When asked for recommendations, suggest specific study plans or peer-tutoring between top and weak performers.
      CRITICAL: Keep your response to EXCEPTLY ONE LINE. Do not use multiple paragraphs or sentences if they can be condensed into one line.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${context}\n\nUser Question: ${userMessage}`
      });

      const text = response.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              "mb-4 glass-card border flex flex-col overflow-hidden transition-all duration-300",
              isMinimized ? "w-72 h-14" : "w-[400px] h-[600px]",
              theme === 'dark' ? "shadow-[0_0_50px_rgba(155,77,255,0.2)]" : "shadow-xl border-slate-200"
            )}
          >
            {/* Header */}
            <div className={cn(
              "px-6 py-4 flex items-center justify-between border-b",
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Pathmark AI</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] opacity-40 uppercase font-black">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors opacity-40 hover:opacity-100"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors opacity-40 hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            {!isMinimized && (
              <>
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4 text-sm"
                >
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex gap-3",
                      m.role === 'user' ? "flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs",
                        m.role === 'assistant' ? "bg-purple-600 text-white" : (theme === 'dark' ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700")
                      )}>
                        {m.role === 'assistant' ? <Sparkles size={14} /> : <User size={14} />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl max-w-[80%]",
                        m.role === 'assistant' 
                          ? (theme === 'dark' ? "bg-white/5 border border-white/10" : "bg-slate-50") 
                          : (theme === 'dark' ? "bg-purple-600/20 text-purple-200 border border-purple-500/30" : "bg-brand-primary text-white")
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                        <Sparkles size={14} className="animate-spin" />
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-1",
                        theme !== 'dark' && "bg-slate-50 border-slate-200"
                      )}>
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className={cn(
                  "p-4 border-t",
                  theme === 'dark' ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                )}>
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
                    theme === 'dark' ? "bg-white/5 border-white/10 focus-within:border-purple-500/50" : "bg-slate-100 border-slate-200"
                  )}>
                    <input 
                      type="text" 
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Ask me anything..."
                      className="bg-transparent border-none focus:outline-none flex-1 text-sm py-1"
                    />
                    <button 
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all",
          theme === 'dark' 
            ? "bg-purple-600 text-white shadow-purple-500/40" 
            : "bg-brand-primary text-white"
        )}
      >
        <Bot size={32} />
      </motion.button>
    </div>
  );
}

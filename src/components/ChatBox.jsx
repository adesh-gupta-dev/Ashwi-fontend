import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = SpeechRecognition ? new SpeechRecognition() : null;

if (mic) {
  mic.continuous = true;
  mic.interimResults = true;
  mic.lang = 'en-US';
}

const TypingIndicator = () => (
  <div className="flex space-x-1 p-6 bg-[var(--color-surface-container-high)] border border-white/40 text-[var(--color-on-surface)] rounded-2xl rounded-tl-none shadow-sm w-20 items-center justify-center">
    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-[var(--color-on-surface-variant)] rounded-full" />
    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-[var(--color-on-surface-variant)] rounded-full" />
    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-[var(--color-on-surface-variant)] rounded-full" />
  </div>
);

const ChatBox = ({ messages, isLoading, onSendMessage, onVoiceError }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!mic) return;
    
    if (isListening) {
      try {
        mic.start();
      } catch {
        onVoiceError?.('Voice input is unavailable right now.');
      }
      mic.onend = () => {
        if (isListening) {
          try {
            mic.start();
          } catch {
            onVoiceError?.('Unable to restart voice capture.');
          }
        }
      };
    } else {
      mic.stop();
      mic.onend = () => {};
    }
    
    mic.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInput(transcript);
    };
    mic.onerror = event => {
      onVoiceError?.(`Voice input error: ${event.error}`);
      setIsListening(false);
    };
  }, [isListening, onVoiceError]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    setIsListening(false);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // reset height after send
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
    }
  };

  const handleInput = (e) => {
      setInput(e.target.value);
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
      }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chat Display Area */}
      <section className="flex-1 overflow-y-auto px-8 py-12 space-y-10 max-w-5xl mx-auto w-full pb-32 relative z-10">
        <AnimatePresence>
          {messages.length === 0 && !isLoading && (
            <motion.div 
              key="welcome-screen"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4 py-12"
            >
              <h2 className="font-headline text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
                Cognitive Sanctuary is Ready.
              </h2>
              <p className="text-[var(--color-on-surface-variant)] text-lg max-w-md mx-auto">
                How can Ashwi assist your workflow today?
              </p>
            </motion.div>
          )}

          <div key="chat-messages" className="space-y-8">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-4 max-w-4xl ${msg.isBot ? '' : 'flex-row-reverse ml-auto'}`}
              >
                {msg.isBot ? (
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--color-surface-container-highest)] flex items-center justify-center text-[var(--color-primary)]">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                ) : (
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--color-primary-container)] border-2 border-[var(--color-primary-container)]/20 shadow-sm flex items-center justify-center text-[var(--color-on-primary-container)] font-bold text-sm">
                        U
                    </div>
                )}

                <div className={`space-y-2 group ${msg.isBot ? 'w-full' : 'text-right'}`}>
                  <div className={`p-6 shadow-sm text-[15px] leading-relaxed break-words ${
                    msg.isBot 
                      ? 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] rounded-2xl rounded-tl-none border border-[var(--color-outline-variant)]/20'
                      : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-2xl rounded-tr-none shadow-md'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className={`text-[11px] text-[var(--color-on-surface-variant)]/60 font-medium px-1 flex items-center gap-2 ${msg.isBot ? '' : 'justify-end'}`}>
                    {msg.isBot ? 'ASHWI AI' : 'YOU'}
                    {msg.isBot && (
                      <button 
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:text-[var(--color-primary)]"
                        title="Copy to clipboard"
                      >
                        <span className="material-symbols-outlined text-xs">content_copy</span>
                      </button>
                    )}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4 max-w-4xl">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--color-surface-container-highest)] flex items-center justify-center text-[var(--color-primary)] animate-pulse">
                    <span className="material-symbols-outlined text-lg " style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <TypingIndicator />
              </motion.div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        </AnimatePresence>
      </section>

      {/* Bottom Input Bar */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/90 to-transparent z-40 lg:ml-64">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-[var(--color-primary)]/5 blur-2xl rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          
          <div className="relative bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-2xl border border-[var(--color-outline-variant)]/30 rounded-3xl p-2 shadow-xl ring-1 ring-black/[0.03]">
            <div className="flex items-end gap-2">
              <button className="p-3 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors rounded-2xl hover:bg-[var(--color-surface-container-high)]">
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/50 resize-none font-medium text-[15px] overflow-hidden"
                placeholder="Message Ashwi..."
                rows="1"
                style={{ minHeight: '48px', maxHeight: '150px' }}
              />
              
              <div className="flex items-center gap-1.5 p-1">
                {mic && (
                  <button
                    type="button"
                    onClick={() => setIsListening(!isListening)}
                    className={`p-2.5 transition-all rounded-2xl hover:bg-[var(--color-surface-container-high)] ${
                      isListening ? 'text-[var(--color-error)] animate-pulse bg-[var(--color-error-container)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
                    }`}
                  >
                    <span className="material-symbols-outlined">{isListening ? 'stop_circle' : 'mic'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white p-3 rounded-2xl shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="material-symbols-outlined fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-3 gap-6">
            <div className="flex items-center gap-1 text-[11px] text-[var(--color-on-surface-variant)] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-tertiary-fixed-dim)] shadow-[0_0_8px_var(--color-tertiary-fixed-dim)]"></span>
              AI Online
            </div>
            <div className="text-[11px] text-[var(--color-on-surface-variant)]/50 font-medium italic hidden sm:block">
              Ashwi can provide insights but consult professionals for critical decisions.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatBox;

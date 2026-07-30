import React, { useState, useRef, useEffect } from 'react';
import UserMessage from './UserMessage';
import ArenaResponse from './ArenaResponse';
import AuthModal from './AuthModal';
import { Send, Menu, Settings2, ChevronLeft, LogIn, LogOut, Trash2, Plus, MessageSquare } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [judgeProvider, setJudgeProvider] = useState('gemini');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [inputWidth, setInputWidth] = useState(360);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [user, setUser] = useState(null);

  const endOfMessagesRef = useRef(null);
  const textareaRef = useRef(null);

  // Load and verify auth token on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    }

    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          // Token invalid or expired
          handleSignOut();
        }
      } catch (err) {
        console.error("Error verifying current user:", err);
      }
    };

    checkUser();
  }, []);

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setHistoryList([]);
      return;
    }
    try {
      const res = await fetch("/api/history", {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistoryList([]);
    }
  }, [user]);

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        const style = window.getComputedStyle(textarea);
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        
        const lines = inputValue.split('\n');
        const maxLineWidth = lines.reduce((max, line) => {
          const metrics = context.measureText(line || textarea.placeholder);
          return Math.max(max, metrics.width);
        }, 0);

        const padding = 88;
        const minW = 360;
        const maxW = 768;
        setInputWidth(Math.min(maxW, Math.max(minW, maxLineWidth + padding)));
      }
    }
  }, [inputValue]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const problemText = inputValue;
    setInputValue('');
    setIsStreaming(true);

    const newMessageId = Date.now();
    const newMessage = {
      id: newMessageId,
      problem: problemText,
      solution_1: '',
      solution_2: '',
      judge: null,
      isNew: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/stream", {
        method: "POST",
        headers,
        body: JSON.stringify({ input: problemText, judge_provider: judgeProvider })
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.replace('data: ', '').trim();
                if (!dataStr) return;
                const event = JSON.parse(dataStr);
                
                if (event.event === "on_chain_end") {
                   const output = event.data?.output;
                   if (output?.solution_1) {
                     setMessages(prev => prev.map(msg => msg.id === newMessageId ? { ...msg, solution_1: output.solution_1, solution_2: output.solution_2 } : msg));
                   }
                   if (output?.judge) {
                     setMessages(prev => prev.map(msg => msg.id === newMessageId ? { ...msg, judge: output.judge } : msg));
                   }
                }
              } catch (err) {
                console.error("Error parsing SSE JSON:", err);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsStreaming(false);
      setTimeout(scrollToBottom, 100);
      if (user) {
        setTimeout(fetchHistory, 1000);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadHistoryItem = (item) => {
    setSelectedHistoryId(item._id);
    setMessages([{
      id: item._id,
      problem: item.problem,
      solution_1: item.solution_1,
      solution_2: item.solution_2,
      judge: item.judge
    }]);
  };

  const handleNewBattle = () => {
    setSelectedHistoryId(null);
    setMessages([]);
  };

  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/history/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        setHistoryList(prev => prev.filter(item => item._id !== id));
        if (selectedHistoryId === id) {
          setMessages([]);
          setSelectedHistoryId(null);
        }
      }
    } catch (err) {
      console.error("Error deleting history:", err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setHistoryList([]);
    setMessages([]);
    setSelectedHistoryId(null);
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:sticky top-0 left-0 h-screen z-30 md:z-auto transition-all duration-300 ease-in-out bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex flex-col ${
          isSidebarOpen ? 'w-64 p-4 border-r translate-x-0' : 'w-64 md:w-0 p-4 md:p-0 border-r md:border-r-0 md:overflow-hidden -translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 flex items-center gap-2">
             <Menu className="w-4 h-4" /> History
          </h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            title="Close Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Battle Button */}
        <button
          onClick={handleNewBattle}
          className="w-full mb-4 py-2 px-3 bg-white dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Battle</span>
        </button>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {!user ? (
            <div className="text-center py-8 px-2">
              <p className="text-xs text-zinc-400 mb-3">Sign in to save and view your battle history.</p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-1.5 px-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Sign In
              </button>
            </div>
          ) : historyList.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">No past battles saved yet.</p>
          ) : (
            historyList.map((item) => (
              <div
                key={item._id}
                onClick={() => loadHistoryItem(item)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                  selectedHistoryId === item._id
                    ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                  <span className="truncate">{item.problem}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteHistory(e, item._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 rounded transition-all"
                  title="Delete battle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-h-screen">
        <header className="py-4 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                title="Open Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">AI Chat Arena</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm bg-zinc-100 dark:bg-zinc-900 py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Settings2 className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Judge:</span>
              <select 
                value={judgeProvider} 
                onChange={(e) => setJudgeProvider(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer outline-none font-medium"
              >
                <option value="gemini" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Gemini Flash</option>
                <option value="mistral" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Mistral Medium</option>
                <option value="cohere" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Cohere Command</option>
              </select>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm" title={user.name || user.email}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-medium flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-transform active:scale-95 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-8 w-full max-w-5xl mx-auto flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <span className="text-3xl">⚔️</span>
                </div>
                <h2 className="text-3xl font-medium mb-3 bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-zinc-100 dark:to-zinc-500 bg-clip-text text-transparent">
                  Welcome to the Arena
                </h2>
                <p className="text-zinc-500 max-w-md mx-auto text-lg leading-relaxed">
                  Pound out a complex problem and watch multiple AIs battle for the optimal solution.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                <UserMessage message={msg.problem} />
                <ArenaResponse
                  solution1={msg.solution_1 || (isStreaming ? "Thinking..." : "")}
                  solution2={msg.solution_2 || (isStreaming ? "Thinking..." : "")}
                  judge={msg.judge}
                  isNew={!!msg.isNew}
                  isStreaming={isStreaming}
                />
              </div>
            ))
          )}
          <div ref={endOfMessagesRef} className="h-24" />
        </main>

        <div className="sticky bottom-0 w-full bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 p-4 md:p-6 pt-12 flex justify-center">
          <div 
            style={{ width: `${inputWidth}px`, maxWidth: 'calc(100% - 1rem)' }}
            className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-1.5 shadow-lg border border-zinc-200 dark:border-zinc-800 transition-[width] duration-200 ease-out focus-within:ring-2 focus-within:ring-blue-500/50"
          >
            <form onSubmit={handleSend} className="relative flex items-end bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a coding question..."
                className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 border-none resize-none py-2.5 pl-4 pr-12 focus:ring-0 focus:outline-none placeholder-zinc-400 min-h-[40px] max-h-[200px]"
                rows={1}
              />
              <div className="absolute right-2 bottom-1.5">
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 p-1.5 rounded-full transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <div className="text-center mt-2">
               <span className="text-[10px] font-medium text-zinc-400">AI can make mistakes. Verify important code.</span>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
        }}
      />
    </div>
  );
}
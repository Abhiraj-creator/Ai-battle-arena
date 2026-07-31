import React, { useState, useRef, useEffect, useCallback } from 'react';
import UserMessage from './UserMessage';
import ArenaResponse from './ArenaResponse';
import AuthModal from './AuthModal';
import { Send, Menu, Settings2, ChevronLeft, LogIn, LogOut, Trash2, Plus, MessageSquare, Swords } from 'lucide-react';

/** Generate a UUID v4 (crypto API, no library needed) */
function generateBattleId() {
  return crypto.randomUUID();
}

export default function ChatInterface() {
  // ─── State ───────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);          // turns in current view
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [judgeProvider, setJudgeProvider] = useState('gemini');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [battleList, setBattleList] = useState([]);      // one entry per battle (from aggregation)
  const [activeBattleId, setActiveBattleId] = useState(null); // current battle UUID
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);  // next turn number within the battle
  const [user, setUser] = useState(null);
  const [isLoadingBattle, setIsLoadingBattle] = useState(false);

  const endOfMessagesRef = useRef(null);
  const textareaRef = useRef(null);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { /* ignore */ }
    }

    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          handleSignOut();
        }
      } catch (err) {
        console.error("Error verifying current user:", err);
      }
    };
    checkUser();
  }, []);

  // ─── Fetch battle list (sidebar) ──────────────────────────────────────────
  const fetchBattleList = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setBattleList([]); return; }
    try {
      const res = await fetch("/api/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setBattleList(await res.json());
    } catch (err) {
      console.error("Error fetching battle list:", err);
    }
  }, []);

  useEffect(() => {
    if (user) fetchBattleList();
    else setBattleList([]);
  }, [user, fetchBattleList]);

  // ─── Load all turns of a battle from history ──────────────────────────────
  const loadBattle = async (battleId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setIsLoadingBattle(true);
    try {
      const res = await fetch(`/api/history/battle/${battleId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const turns = await res.json();
        // Map DB docs → message shape (isNew=false → instant render, no animation)
        setMessages(turns.map(t => ({
          id: t._id,
          problem: t.problem,
          solution_1: t.solution_1,
          solution_2: t.solution_2,
          judge: t.judge,
          isNew: false,
        })));
        setActiveBattleId(battleId);
        setActiveTurnIndex(turns.length); // next turn starts here
      }
    } catch (err) {
      console.error("Error loading battle turns:", err);
    } finally {
      setIsLoadingBattle(false);
    }
  };

  // ─── Start a brand-new battle ─────────────────────────────────────────────
  const handleNewBattle = () => {
    const newId = generateBattleId();
    setActiveBattleId(newId);
    setActiveTurnIndex(0);
    setMessages([]);
  };

  // ─── Delete an entire battle ──────────────────────────────────────────────
  const handleDeleteBattle = async (e, battleId) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/history/battle/${battleId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setBattleList(prev => prev.filter(b => b.battleId !== battleId));
        // If we deleted the active battle, reset to fresh
        if (activeBattleId === battleId) {
          handleNewBattle();
        }
      }
    } catch (err) {
      console.error("Error deleting battle:", err);
    }
  };

  // ─── Auto-grow textarea ───────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = 'auto';
      const maxHeight = Math.floor(window.innerHeight * 0.4);
      ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
    }
  }, [inputValue]);

  const handleTextareaFocus = () => {
    if (window.innerWidth < 768) {
      setTimeout(() => {
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
    }
  };

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  // ─── Send a turn ──────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    if (!user) { setIsAuthModalOpen(true); return; }

    // If no active battle yet, create one on-the-fly
    let currentBattleId = activeBattleId;
    if (!currentBattleId) {
      currentBattleId = generateBattleId();
      setActiveBattleId(currentBattleId);
    }

    const currentTurnIndex = activeTurnIndex;
    const problemText = inputValue;
    setInputValue('');
    setIsStreaming(true);

    // Immediately add a placeholder turn so the UI responds instantly
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      problem: problemText,
      solution_1: '',
      solution_2: '',
      judge: null,
      isNew: true,
    }]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          input: problemText,
          judge_provider: judgeProvider,
          battleId: currentBattleId,
          turnIndex: currentTurnIndex,
        })
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
          chunk.split('\n').forEach(line => {
            if (!line.startsWith('data: ')) return;
            try {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr) return;
              const event = JSON.parse(dataStr);
              if (event.event === "on_chain_end") {
                const output = event.data?.output;
                if (output?.solution_1) {
                  setMessages(prev => prev.map(msg =>
                    msg.id === tempId
                      ? { ...msg, solution_1: output.solution_1, solution_2: output.solution_2 }
                      : msg
                  ));
                }
                if (output?.judge) {
                  setMessages(prev => prev.map(msg =>
                    msg.id === tempId ? { ...msg, judge: output.judge } : msg
                  ));
                }
              }
            } catch (err) {
              console.error("Error parsing SSE JSON:", err);
            }
          });
        }
      }

      // Advance the turn counter for next send in this battle
      setActiveTurnIndex(currentTurnIndex + 1);

    } catch (error) {
      console.error("Streaming error:", error);
      // Remove the failed placeholder
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setIsStreaming(false);
      setTimeout(scrollToBottom, 100);
      // Refresh sidebar battle list after a short delay
      if (user) setTimeout(fetchBattleList, 1200);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setBattleList([]);
    setMessages([]);
    setActiveBattleId(null);
    setActiveTurnIndex(0);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 transition-colors">

      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen z-30 md:z-auto transition-all duration-300 ease-in-out bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex flex-col ${
          isSidebarOpen
            ? 'w-64 p-4 border-r translate-x-0'
            : 'w-64 md:w-0 p-4 md:p-0 border-r md:border-r-0 md:overflow-hidden -translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 flex items-center gap-2">
            <Swords className="w-4 h-4" /> Battles
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            title="Close Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Battle button */}
        <button
          onClick={handleNewBattle}
          className="w-full mb-4 py-2 px-3 bg-white dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Battle</span>
        </button>

        {/* Battle list */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {!user ? (
            <div className="text-center py-8 px-2">
              <p className="text-xs text-zinc-400 mb-3">Sign in to save and view your battles.</p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-1.5 px-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Sign In
              </button>
            </div>
          ) : battleList.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">No battles yet. Start one above!</p>
          ) : (
            battleList.map((battle) => (
              <div
                key={battle.battleId}
                onClick={() => loadBattle(battle.battleId)}
                className={`group relative flex items-start justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                  activeBattleId === battle.battleId
                    ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-start gap-2 overflow-hidden mr-2 flex-1 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-zinc-400 mt-0.5" />
                  <div className="min-w-0">
                    <p className="truncate leading-snug">{battle.firstProblem}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Turn count badge */}
                      <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                        <Swords className="w-2.5 h-2.5" />
                        {battle.turnCount} {battle.turnCount === 1 ? 'turn' : 'turns'}
                      </span>
                      <span className="text-zinc-400 text-[10px]">{formatDate(battle.lastActivity)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteBattle(e, battle.battleId)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 rounded transition-all shrink-0"
                  title="Delete battle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col relative min-h-screen">

        {/* Header */}
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">AI Battle Arena</h1>
              {/* Active battle indicator */}
              {activeBattleId && messages.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  <Swords className="w-3 h-3" />
                  {messages.length} {messages.length === 1 ? 'turn' : 'turns'}
                </span>
              )}
            </div>
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
                <option value="gemini">Gemini Flash</option>
                <option value="mistral">Mistral Medium</option>
                <option value="cohere">Cohere Command</option>
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

        {/* Messages */}
        <main className="flex-1 px-4 md:px-8 py-8 w-full max-w-5xl mx-auto flex flex-col">
          {isLoadingBattle ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-zinc-400">Loading battle…</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <span className="text-3xl">⚔️</span>
                </div>
                <h2 className="text-3xl font-medium mb-3 bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-zinc-100 dark:to-zinc-500 bg-clip-text text-transparent">
                  Welcome to the Arena
                </h2>
                <p className="text-zinc-500 max-w-md mx-auto text-lg leading-relaxed">
                  Each battle supports multiple rounds. Send your first query to start, then keep going — all turns are saved together.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Turn timeline */}
              {messages.map((msg, idx) => (
                <div key={msg.id} className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                  {/* Turn label */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      <Swords className="w-3 h-3" /> Turn {idx + 1}
                    </span>
                    <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  <UserMessage message={msg.problem} />
                  <ArenaResponse
                    solution1={msg.solution_1 || (isStreaming && idx === messages.length - 1 ? "Thinking..." : "")}
                    solution2={msg.solution_2 || (isStreaming && idx === messages.length - 1 ? "Thinking..." : "")}
                    judge={msg.judge}
                    isNew={!!msg.isNew}
                    isStreaming={isStreaming && idx === messages.length - 1}
                  />
                </div>
              ))}
            </>
          )}
          <div ref={endOfMessagesRef} className="h-24" />
        </main>

        {/* Input bar */}
        <div className="sticky bottom-0 w-full bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 p-3 md:p-6 pt-10 md:pt-12 flex justify-center">
          <div className="w-full md:w-auto md:min-w-[360px] md:max-w-3xl bg-zinc-100 dark:bg-zinc-900 rounded-2xl md:rounded-3xl p-1.5 shadow-lg border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-blue-500/50 transition-shadow">
            <form onSubmit={handleSend} className="relative flex items-end bg-white dark:bg-zinc-950 rounded-xl md:rounded-2xl overflow-hidden">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleTextareaFocus}
                placeholder={messages.length > 0 ? "Continue this battle with another question…" : "Ask a coding question to start the battle…"}
                className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 border-none resize-none py-3 pl-4 pr-12 focus:ring-0 focus:outline-none placeholder-zinc-400 min-h-[44px] text-sm md:text-base leading-relaxed"
                rows={1}
                style={{ maxHeight: `${Math.floor(window.innerHeight * 0.4)}px`, overflowY: 'auto' }}
              />
              <div className="absolute right-2 bottom-2">
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 p-1.5 rounded-full transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <div className="text-center mt-1.5 mb-0.5">
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
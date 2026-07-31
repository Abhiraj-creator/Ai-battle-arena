import { LogIn, LogOut, Menu, Settings2, Swords } from "lucide-react";

export default function ChatHeader({
  user,
  messages,
  activeBattleId,
  isSidebarOpen,
  judgeProvider,
  onOpenSidebar,
  onOpenAuth,
  onSignOut,
  onJudgeProviderChange
}) {
  return (
    <header className="py-4 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <button
            onClick={onOpenSidebar}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            title="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">AI Battle Arena</h1>
          {activeBattleId && messages.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              <Swords className="w-3 h-3" />
              {messages.length} {messages.length === 1 ? "turn" : "turns"}
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
            onChange={(e) => onJudgeProviderChange(e.target.value)}
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
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <button
              onClick={onSignOut}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-medium flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-transform active:scale-95 shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}

import { ChevronLeft, MessageSquare, Plus, Swords, Trash2 } from "lucide-react";
import { formatDate } from "../utils/battle";

export default function BattleSidebar({
  isOpen,
  user,
  battleList,
  activeBattleId,
  onClose,
  onOpenAuth,
  onNewBattle,
  onLoadBattle,
  onDeleteBattle
}) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed md:sticky top-0 left-0 h-screen z-30 md:z-auto transition-all duration-300 ease-in-out bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex flex-col ${
          isOpen
            ? "w-64 p-4 border-r translate-x-0"
            : "w-64 md:w-0 p-4 md:p-0 border-r md:border-r-0 md:overflow-hidden -translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 flex items-center gap-2">
            <Swords className="w-4 h-4" /> Battles
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            title="Close Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onNewBattle}
          className="w-full mb-4 py-2 px-3 bg-white dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Battle</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {!user ? (
            <div className="text-center py-8 px-2">
              <p className="text-xs text-zinc-400 mb-3">Sign in to save and view your battles.</p>
              <button
                onClick={onOpenAuth}
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
                onClick={() => onLoadBattle(battle.battleId)}
                className={`group relative flex items-start justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                  activeBattleId === battle.battleId
                    ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                    : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <div className="flex items-start gap-2 overflow-hidden mr-2 flex-1 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-zinc-400 mt-0.5" />
                  <div className="min-w-0">
                    <p className="truncate leading-snug">{battle.firstProblem}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                        <Swords className="w-2.5 h-2.5" />
                        {battle.turnCount} {battle.turnCount === 1 ? "turn" : "turns"}
                      </span>
                      <span className="text-zinc-400 text-[10px]">{formatDate(battle.lastActivity)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => onDeleteBattle(e, battle.battleId)}
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
    </>
  );
}

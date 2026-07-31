import { Swords } from "lucide-react";
import ArenaResponse from "../../../components/ArenaResponse";
import UserMessage from "../../../components/UserMessage";

export default function MessageList({ messages, isLoadingBattle, isStreaming, endOfMessagesRef }) {
  return (
    <main className="flex-1 px-4 md:px-8 py-8 w-full max-w-5xl mx-auto flex flex-col">
      {isLoadingBattle ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-zinc-400">Loading battle...</p>
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
              Each battle supports multiple rounds. Send your first query to start, then keep going - all turns are saved together.
            </p>
          </div>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <div key={msg.id} className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
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
        ))
      )}
      <div ref={endOfMessagesRef} className="h-24" />
    </main>
  );
}

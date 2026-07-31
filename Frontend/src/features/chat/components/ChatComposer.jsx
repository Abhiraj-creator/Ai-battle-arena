import { Send } from "lucide-react";

export default function ChatComposer({
  inputValue,
  messages,
  isStreaming,
  textareaRef,
  onInputChange,
  onKeyDown,
  onFocus,
  onSubmit
}) {
  return (
    <div className="sticky bottom-0 w-full bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 p-3 md:p-6 pt-10 md:pt-12 flex justify-center">
      <div className="w-full md:w-auto md:min-w-[360px] md:max-w-3xl bg-zinc-100 dark:bg-zinc-900 rounded-2xl md:rounded-3xl p-1.5 shadow-lg border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-blue-500/50 transition-shadow">
        <form onSubmit={onSubmit} className="relative flex items-end bg-white dark:bg-zinc-950 rounded-xl md:rounded-2xl overflow-hidden">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            placeholder={messages.length > 0 ? "Continue this battle with another question..." : "Ask a coding question to start the battle..."}
            className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 border-none resize-none py-3 pl-4 pr-12 focus:ring-0 focus:outline-none placeholder-zinc-400 min-h-[44px] text-sm md:text-base leading-relaxed"
            rows={1}
            style={{ maxHeight: `${Math.floor(window.innerHeight * 0.4)}px`, overflowY: "auto" }}
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
  );
}

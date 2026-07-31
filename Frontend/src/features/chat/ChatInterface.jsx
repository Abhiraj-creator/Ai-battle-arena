import { useCallback, useEffect, useRef, useState } from "react";
import AuthModal from "../../components/AuthModal";
import { clearAuth, fetchCurrentUser, getStoredUser, getToken, saveAuth } from "../../api/auth";
import { deleteBattleById, fetchBattleList, fetchBattleTurns } from "../../api/history";
import { streamBattleTurn } from "../../api/stream";
import { generateBattleId, toMessage } from "./utils/battle";
import BattleSidebar from "./components/BattleSidebar";
import ChatComposer from "./components/ChatComposer";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [judgeProvider, setJudgeProvider] = useState("gemini");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [battleList, setBattleList] = useState([]);
  const [activeBattleId, setActiveBattleId] = useState(null);
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoadingBattle, setIsLoadingBattle] = useState(false);

  const endOfMessagesRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSignOut = useCallback(() => {
    clearAuth();
    setUser(null);
    setBattleList([]);
    setMessages([]);
    setActiveBattleId(null);
    setActiveTurnIndex(0);
  }, []);

  const refreshBattleList = useCallback(async () => {
    try {
      setBattleList(await fetchBattleList());
    } catch (err) {
      console.error("Error fetching battle list:", err);
    }
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) setUser(storedUser);

    const checkUser = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const currentUser = await fetchCurrentUser();
        if (!currentUser) {
          handleSignOut();
          return;
        }

        saveAuth({ token, user: currentUser });
        setUser(currentUser);
      } catch (err) {
        console.error("Error verifying current user:", err);
      }
    };

    checkUser();
  }, [handleSignOut]);

  useEffect(() => {
    if (user) refreshBattleList();
    else setBattleList([]);
  }, [user, refreshBattleList]);

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    const maxHeight = Math.floor(window.innerHeight * 0.4);
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [inputValue]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleNewBattle = () => {
    setActiveBattleId(generateBattleId());
    setActiveTurnIndex(0);
    setMessages([]);
  };

  const loadBattle = async (battleId) => {
    if (!getToken()) return;

    setIsLoadingBattle(true);
    try {
      const turns = await fetchBattleTurns(battleId);
      if (!turns) return;

      setMessages(turns.map(toMessage));
      setActiveBattleId(battleId);
      setActiveTurnIndex(turns.length);
    } catch (err) {
      console.error("Error loading battle turns:", err);
    } finally {
      setIsLoadingBattle(false);
    }
  };

  const handleDeleteBattle = async (e, battleId) => {
    e.stopPropagation();

    try {
      const deleted = await deleteBattleById(battleId);
      if (!deleted) return;

      setBattleList((prev) => prev.filter((battle) => battle.battleId !== battleId));
      if (activeBattleId === battleId) handleNewBattle();
    } catch (err) {
      console.error("Error deleting battle:", err);
    }
  };

  const handleTextareaFocus = () => {
    if (window.innerWidth >= 768) return;

    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 300);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentBattleId = activeBattleId || generateBattleId();
    if (!activeBattleId) setActiveBattleId(currentBattleId);

    const currentTurnIndex = activeTurnIndex;
    const problemText = inputValue;
    const tempId = `temp-${Date.now()}`;

    setInputValue("");
    setIsStreaming(true);
    setMessages((prev) => [...prev, {
      id: tempId,
      problem: problemText,
      solution_1: "",
      solution_2: "",
      judge: null,
      isNew: true
    }]);

    try {
      const response = await streamBattleTurn({
        input: problemText,
        judgeProvider,
        battleId: currentBattleId,
        turnIndex: currentTurnIndex
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (!value) continue;

        const chunk = decoder.decode(value, { stream: true });
        chunk.split("\n").forEach((line) => {
          if (!line.startsWith("data: ")) return;

          try {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) return;

            const event = JSON.parse(dataStr);
            if (event.event !== "on_chain_end") return;

            const output = event.data?.output;
            if (output?.solution_1) {
              setMessages((prev) => prev.map((msg) =>
                msg.id === tempId
                  ? { ...msg, solution_1: output.solution_1, solution_2: output.solution_2 }
                  : msg
              ));
            }

            if (output?.judge) {
              setMessages((prev) => prev.map((msg) =>
                msg.id === tempId ? { ...msg, judge: output.judge } : msg
              ));
            }
          } catch (err) {
            console.error("Error parsing SSE JSON:", err);
          }
        });
      }

      setActiveTurnIndex(currentTurnIndex + 1);
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setIsStreaming(false);
      setTimeout(scrollToBottom, 100);
      if (user) setTimeout(refreshBattleList, 1200);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;

    e.preventDefault();
    handleSend();
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 transition-colors">
      <BattleSidebar
        isOpen={isSidebarOpen}
        user={user}
        battleList={battleList}
        activeBattleId={activeBattleId}
        onClose={() => setIsSidebarOpen(false)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onNewBattle={handleNewBattle}
        onLoadBattle={loadBattle}
        onDeleteBattle={handleDeleteBattle}
      />

      <div className="flex-1 flex flex-col relative min-h-screen">
        <ChatHeader
          user={user}
          messages={messages}
          activeBattleId={activeBattleId}
          isSidebarOpen={isSidebarOpen}
          judgeProvider={judgeProvider}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          onJudgeProviderChange={setJudgeProvider}
        />

        <MessageList
          messages={messages}
          isLoadingBattle={isLoadingBattle}
          isStreaming={isStreaming}
          endOfMessagesRef={endOfMessagesRef}
        />

        <ChatComposer
          inputValue={inputValue}
          messages={messages}
          isStreaming={isStreaming}
          textareaRef={textareaRef}
          onInputChange={setInputValue}
          onKeyDown={handleKeyDown}
          onFocus={handleTextareaFocus}
          onSubmit={handleSend}
        />
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={setUser}
      />
    </div>
  );
}

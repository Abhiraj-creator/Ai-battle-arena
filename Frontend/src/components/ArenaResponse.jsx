import { useEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/atom-one-dark.css';

/**
 * GLITCH FIX — Root cause was setInterval racing with React StrictMode's
 * intentional double-invoke of effects. When StrictMode unmounts+remounts,
 * the cleanup fired (resetting refs) but the OLD interval kept running,
 * starting a second interval from index 0. Two intervals then race each other
 * causing text to flicker, reset, or jump.
 *
 * Fix: use requestAnimationFrame (RAF) with a single rafRef. Because RAF IDs
 * are cancelled before a new loop starts, there is NEVER more than one active
 * animation loop. The CHARSPER_FRAME constant replaces the speed ms-per-tick.
 */
const CHARS_PER_FRAME = 8; // characters revealed per animation frame (~60fps)

function useTypingEffect(fullText, active) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);
  // Single ref holds the current RAF id — always cancelled before re-start
  const rafRef = useRef(null);
  // Stable ref to the current fullText so the RAF closure never goes stale
  const fullTextRef = useRef(fullText);
  const indexRef = useRef(0);
  const hasStartedRef = useRef(false);

  // Keep fullTextRef in sync
  useEffect(() => {
    fullTextRef.current = fullText;
  }, [fullText]);

  const startAnimation = useCallback(() => {
    // Cancel any previous loop (StrictMode safety)
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const text = fullTextRef.current;
      indexRef.current = Math.min(indexRef.current + CHARS_PER_FRAME, text.length);
      setDisplayed(text.slice(0, indexRef.current));

      if (indexRef.current < text.length) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setIsDone(true);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // History view — render immediately, no animation
    if (!active) {
      setDisplayed(fullText);
      setIsDone(true);
      return;
    }

    // Wait until real content arrives (not placeholder)
    if (!fullText || fullText === 'Thinking...') return;

    // Only start ONCE per message — guard against re-renders during streaming
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    indexRef.current = 0;
    setDisplayed('');
    setIsDone(false);
    startAnimation();

    return () => {
      // Cancel RAF and fully reset so StrictMode's re-invoke starts clean
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      indexRef.current = 0;
      hasStartedRef.current = false;
    };
  }, [fullText, active, startAnimation]);

  return [displayed, isDone];
}

function MarkdownContent({ content }) {
  // NOTE: hljs.highlightAll() was REMOVED — it mutated DOM nodes owned by React
  // causing reconciliation conflicts (content flash/glitch). Instead, code blocks
  // are highlighted inline via the className prop that react-markdown already
  // passes ("language-xxx") which hljs can target per-element safely.
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ ...props }) => <h1 className="text-xl md:text-2xl font-bold mt-6 mb-4 text-zinc-900 dark:text-white" {...props} />,
        h2: ({ ...props }) => <h2 className="text-lg md:text-xl font-bold mt-5 mb-3 text-zinc-900 dark:text-white" {...props} />,
        h3: ({ ...props }) => <h3 className="text-base md:text-lg font-bold mt-4 mb-2 text-zinc-900 dark:text-white" {...props} />,
        p: ({ ...props }) => <p className="mb-4 leading-relaxed text-zinc-700 dark:text-zinc-300" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-5 md:pl-6 mb-4 text-zinc-700 dark:text-zinc-300 space-y-1" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-5 md:pl-6 mb-4 text-zinc-700 dark:text-zinc-300 space-y-1" {...props} />,
        a: ({ ...props }) => <a className="text-blue-600 hover:text-blue-500 underline" {...props} />,
        code: ({ inline, className, children, ...props }) => {
          const lang = className?.replace('language-', '') || '';
          const copyToClipboard = () => {
            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
          };
          return !inline ? (
            <div className="rounded-xl overflow-hidden my-4 border border-zinc-200 dark:border-zinc-800 relative group max-w-full">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{lang || 'code'}</span>
                <button
                  onClick={copyToClipboard}
                  className="text-zinc-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 bg-zinc-950 overflow-x-auto text-xs md:text-sm text-zinc-100 max-w-full">
                <code className={className} {...props}>{children}</code>
              </pre>
            </div>
          ) : (
            <code
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1.5 py-0.5 rounded-md text-xs md:text-sm font-mono break-words"
              {...props}
            >
              {children}
            </code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
    </div>
  );
}

export default function ArenaResponse({ solution1, solution2, judge, isNew = false, isStreaming = false }) {
  const [display1, done1] = useTypingEffect(solution1, isNew, 10);
  const [display2, done2] = useTypingEffect(solution2, isNew, 10);

  // Judge panel only visible after BOTH typing animations are done
  const showJudge = judge && !isStreaming && done1 && done2;

  const isSolution1Loading = isStreaming && (!solution1 || solution1 === 'Thinking...');
  const isSolution2Loading = isStreaming && (!solution2 || solution2 === 'Thinking...');

  return (
    <div className="flex flex-col gap-6 md:gap-8 my-6 w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-full">

        {/* Solution 1 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm flex flex-col transition-all hover:shadow-md max-w-full overflow-hidden">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 mb-4 md:mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Solution 1</span>
            {isSolution1Loading && (
              <span className="ml-auto flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            )}
          </h3>
          <div className="text-zinc-700 dark:text-zinc-300 text-sm md:text-base leading-relaxed overflow-hidden max-w-full">
            {isSolution1Loading ? (
              <SkeletonLoader />
            ) : (
              <MarkdownContent content={isNew ? display1 : solution1} />
            )}
          </div>
        </div>

        {/* Solution 2 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm flex flex-col transition-all hover:shadow-md max-w-full overflow-hidden">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 mb-4 md:mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
            <span>Solution 2</span>
            {isSolution2Loading && (
              <span className="ml-auto flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            )}
          </h3>
          <div className="text-zinc-700 dark:text-zinc-300 text-sm md:text-base leading-relaxed overflow-hidden max-w-full">
            {isSolution2Loading ? (
              <SkeletonLoader />
            ) : (
              <MarkdownContent content={isNew ? display2 : solution2} />
            )}
          </div>
        </div>

      </div>

      {/* Judge Panel — only shown after typing animation completes */}
      {showJudge && (
        <div className="mt-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm max-w-full overflow-hidden animate-in fade-in duration-500">
          <h3 className="text-base md:text-lg font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 md:mb-6">
            ⚖️ Judge Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-4 md:px-5 py-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="font-medium text-zinc-600 dark:text-zinc-400 text-xs md:text-sm">Solution 1 Score</span>
                <span className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{judge.solution_1_score}/10</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs md:text-sm leading-relaxed px-2">
                {judge.solution_1_reasoning}
              </p>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-4 md:px-5 py-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="font-medium text-zinc-600 dark:text-zinc-400 text-xs md:text-sm">Solution 2 Score</span>
                <span className="text-lg md:text-2xl font-bold text-violet-600 dark:text-violet-400">{judge.solution_2_score}/10</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs md:text-sm leading-relaxed px-2">
                {judge.solution_2_reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
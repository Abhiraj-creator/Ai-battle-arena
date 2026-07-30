import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

/**
 * A StrictMode-safe typing hook.
 * - Uses refs for ALL mutable state so re-renders never self-cancel the interval.
 * - Cleanup resets startedRef so React StrictMode double-invoke works correctly.
 * - When `active` is false (history view), renders immediately with no animation.
 */
function useTypingEffect(fullText, active, speed = 10) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);
  const startedRef = useRef(false);
  const indexRef = useRef(0);

  useEffect(() => {
    // Not a new message — render immediately
    if (!active) {
      setDisplayed(fullText);
      setIsDone(true);
      return;
    }

    // Wait for real content to arrive from the backend
    if (!fullText || fullText === 'Thinking...') {
      return;
    }

    // Guard: only start once
    if (startedRef.current) return;
    startedRef.current = true;
    indexRef.current = 0;
    setDisplayed('');
    setIsDone(false);

    const id = setInterval(() => {
      indexRef.current = Math.min(indexRef.current + 15, fullText.length);
      setDisplayed(fullText.slice(0, indexRef.current));

      if (indexRef.current >= fullText.length) {
        clearInterval(id);
        setIsDone(true);
      }
    }, speed);

    // Cleanup: clear interval AND reset startedRef so StrictMode re-invoke works
    return () => {
      clearInterval(id);
      startedRef.current = false;
      indexRef.current = 0;
    };
  }, [fullText, active, speed]);

  return [displayed, isDone];
}

function MarkdownContent({ content }) {
  useEffect(() => {
    hljs.highlightAll();
  }, [content]);

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
          const copyToClipboard = () => {
            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
          };
          return !inline ? (
            <div className="rounded-xl overflow-hidden my-4 border border-zinc-200 dark:border-zinc-800 relative group max-w-full">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={copyToClipboard}
                  className="bg-zinc-800 text-zinc-300 hover:text-white p-1.5 rounded-md text-xs font-medium"
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
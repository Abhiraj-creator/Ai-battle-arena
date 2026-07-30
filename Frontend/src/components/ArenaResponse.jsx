import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Typing effect hook — streams text character by character
function useTypingEffect(fullText, isActive, speed = 8) {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef(null);
  const prevTextRef = useRef('');

  useEffect(() => {
    if (!isActive) {
      setDisplayedText(fullText);
      return;
    }

    // If text was cleared/reset
    if (fullText === '' || fullText === 'Thinking...') {
      setDisplayedText(fullText);
      indexRef.current = 0;
      prevTextRef.current = '';
      return;
    }

    // If new text is longer than what we've typed (new content arrived)
    if (fullText.length > indexRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        indexRef.current += 1;
        setDisplayedText(fullText.slice(0, indexRef.current));
        if (indexRef.current >= fullText.length) {
          clearInterval(timerRef.current);
        }
      }, speed);
    }

    return () => clearInterval(timerRef.current);
  }, [fullText, isActive, speed]);

  // When isActive transitions false→true (new message), reset
  useEffect(() => {
    if (isActive) {
      indexRef.current = 0;
      setDisplayedText('');
    }
  }, [isActive]);

  return displayedText;
}

// Reusable markdown renderer
function MarkdownContent({ content }) {
  useEffect(() => {
    hljs.highlightAll();
  }, [content]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-zinc-900 dark:text-white" {...props} />,
        h2: ({ ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-zinc-900 dark:text-white" {...props} />,
        h3: ({ ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-zinc-900 dark:text-white" {...props} />,
        p: ({ ...props }) => <p className="mb-4 leading-relaxed text-zinc-700 dark:text-zinc-300" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300 space-y-1" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 text-zinc-700 dark:text-zinc-300 space-y-1" {...props} />,
        a: ({ ...props }) => <a className="text-blue-600 hover:text-blue-500 underline" {...props} />,
        code: ({ inline, className, children, ...props }) => {
          const copyToClipboard = () => {
            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
          };
          return !inline ? (
            <div className="rounded-xl overflow-hidden my-4 border border-zinc-200 dark:border-zinc-800 relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={copyToClipboard} className="bg-zinc-800 text-zinc-300 hover:text-white p-1.5 rounded-md text-xs font-medium">Copy</button>
              </div>
              <pre className="p-4 bg-zinc-950 overflow-x-auto text-sm text-zinc-100">
                <code className={className} {...props}>{children}</code>
              </pre>
            </div>
          ) : (
            <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1.5 py-0.5 rounded-md text-sm font-mono" {...props}>
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

export default function ArenaResponse({ solution1, solution2, judge, isNew = false, isStreaming = false }) {
  // Activate typing only for brand-new live responses
  const isTypingActive = isNew && isStreaming;
  const typed1 = useTypingEffect(solution1, isNew && !isStreaming && solution1 !== '' && solution1 !== 'Thinking...');
  const typed2 = useTypingEffect(solution2, isNew && !isStreaming && solution2 !== '' && solution2 !== 'Thinking...');

  // When streaming is done and isNew, animate typed display from full text
  const display1 = isStreaming ? solution1 : (isNew ? typed1 : solution1);
  const display2 = isStreaming ? solution2 : (isNew ? typed2 : solution2);

  return (
    <div className="flex flex-col gap-8 my-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Solution 1 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm flex flex-col transition-all hover:shadow-md">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 mb-4 md:mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Solution 1</span>
            {isStreaming && solution1 === 'Thinking...' && (
              <span className="ml-auto flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </h3>
          <div className="text-zinc-700 dark:text-zinc-300 text-sm md:text-base leading-relaxed">
            {solution1 === 'Thinking...' ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              </div>
            ) : (
              <MarkdownContent content={display1} />
            )}
          </div>
        </div>

        {/* Solution 2 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm flex flex-col transition-all hover:shadow-md">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 mb-4 md:mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0"></span>
            <span>Solution 2</span>
            {isStreaming && solution2 === 'Thinking...' && (
              <span className="ml-auto flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </h3>
          <div className="text-zinc-700 dark:text-zinc-300 text-sm md:text-base leading-relaxed">
            {solution2 === 'Thinking...' ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              </div>
            ) : (
              <MarkdownContent content={display2} />
            )}
          </div>
        </div>
      </div>

      {/* Judge Panel */}
      {judge && (
        <div className="mt-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm">
          <h3 className="text-base md:text-lg font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 md:mb-6">
            ⚖️ Judge Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-4 md:px-5 py-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="font-medium text-zinc-600 dark:text-zinc-400 text-sm">Solution 1 Score</span>
                <span className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{judge.solution_1_score}/10</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed px-2">
                {judge.solution_1_reasoning}
              </p>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-4 md:px-5 py-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="font-medium text-zinc-600 dark:text-zinc-400 text-sm">Solution 2 Score</span>
                <span className="text-xl md:text-2xl font-bold text-violet-600 dark:text-violet-400">{judge.solution_2_score}/10</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed px-2">
                {judge.solution_2_reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
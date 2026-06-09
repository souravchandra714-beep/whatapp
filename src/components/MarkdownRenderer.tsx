import React from "react";

interface MarkdownRendererProps {
  text: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  if (!text) return null;

  // Split text by code blocks ```
  const blocks = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5 leading-relaxed break-words text-[14.2px] text-gray-100">
      {blocks.map((block, idx) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          // Matches: ```lang\ncode```
          const match = block.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const code = match ? match[2].trim() : block.substring(3, block.length - 3).trim();
          
          return (
            <div
              key={idx}
              className="my-2 rounded bg-black/40 border border-white/10 font-mono text-xs text-emerald-300"
              id={`codeblock-${idx}`}
            >
              {lang && (
                <div className="bg-black/25 text-white/40 px-2.5 py-1 border-b border-white/5 text-[10px] uppercase font-sans tracking-widest font-semibold">
                  {lang}
                </div>
              )}
              <pre className="p-3 overflow-x-auto whitespace-pre-wrap select-all">
                <code>{code}</code>
              </pre>
            </div>
          );
        } else {
          // Parse inline elements (inline code, bold text)
          const inlineParts = block.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
          
          return (
            <span key={idx} className="block whitespace-pre-wrap">
              {inlineParts.map((part, pIdx) => {
                if (part.startsWith("`") && part.endsWith("`")) {
                  return (
                    <code
                      key={pIdx}
                      className="bg-black/30 px-1 py-0.5 rounded font-mono text-[12.5px] text-yellow-200 border border-black/10"
                    >
                      {part.slice(1, -1)}
                    </code>
                  );
                } else if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={pIdx} className="font-semibold text-white">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </span>
          );
        }
      })}
    </div>
  );
};

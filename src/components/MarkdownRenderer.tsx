/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import mermaid from "mermaid";
import { useEffect, useRef } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  securityLevel: "strict",
});

// Component to render Mermaid diagrams
const MermaidDiagram = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    void (async () => {
      try {
        const { svg } = await mermaid.render(
          `mermaid-${Math.random().toString(36).substring(7)}`,
          chart,
        );
        // Parse as SVG XML (not HTML) so embedded scripts cannot execute,
        // then import the node — safer than setting innerHTML directly.
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svg, "image/svg+xml");
        const svgEl = document.importNode(svgDoc.documentElement, true);
        container.replaceChildren(svgEl);
      } catch (e: unknown) {
        console.error(
          "[MarkdownRenderer] Mermaid render failed:",
          e instanceof Error ? e.message : String(e),
        );
      }
    })();
  }, [chart]);

  return (
    <div ref={containerRef} className="mermaid-diagram my-4 flex justify-center overflow-x-auto" />
  );
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  // Pre-process text to replace :iconName: with a special marker if needed,
  // but remark-emoji handles standard emojis.
  // We can write a custom remark plugin or simply use react-markdown components for special inline parsing if desired.
  // For simplicity, we'll let users use standard emojis with remark-emoji,
  // and we'll apply custom rendering for our code blocks and markdown styles.

  return (
    <div className="prose prose-invert prose-sm md:prose-base max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkEmoji]}
        components={
          {
            code(props: {
              children?: React.ReactNode;
              className?: string;
              [key: string]: unknown;
            }) {
              const { children, className, ...rest } = props;
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";

              // Handle Mermaid
              if (language === "mermaid") {
                return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
              }

              return match ? (
                <SyntaxHighlighter
                  {...rest}
                  style={vscDarkPlus as { [key: string]: React.CSSProperties }}
                  language={language}
                  PreTag="div"
                  className="rounded-md my-4 text-sm"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code
                  {...rest}
                  className={`${className} bg-gray-800 text-pink-400 px-1.5 py-0.5 rounded text-sm`}
                >
                  {children}
                </code>
              );
            },
            // Customize other elements if needed
            a: ({ ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              />
            ),
            p: ({ ...props }) => <p {...props} className="mb-4 leading-relaxed text-gray-300" />,
            ul: ({ ...props }) => (
              <ul {...props} className="list-disc list-inside mb-4 space-y-1 text-gray-300" />
            ),
            ol: ({ ...props }) => (
              <ol {...props} className="list-decimal list-inside mb-4 space-y-1 text-gray-300" />
            ),
            h1: ({ ...props }) => (
              <h1 {...props} className="text-2xl font-bold mb-4 mt-8 text-white" />
            ),
            h2: ({ ...props }) => (
              <h2 {...props} className="text-xl font-bold mb-3 mt-6 text-white" />
            ),
            h3: ({ ...props }) => (
              <h3 {...props} className="text-lg font-bold mb-2 mt-4 text-white" />
            ),
            blockquote: ({ ...props }) => (
              <blockquote
                {...props}
                className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-gray-800/50 text-gray-300 italic rounded-r"
              />
            ),
          } as Components
        }
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

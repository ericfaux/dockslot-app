"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { articles, type ArticleBlock } from "../articles";

// ---------------------------------------------------------------------------
// Inline bold renderer – turns **text** into <strong> elements
// ---------------------------------------------------------------------------

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Content block renderer
// ---------------------------------------------------------------------------

function ContentBlock({ block }: { block: ArticleBlock }) {
  if (block.type === "tip") {
    return (
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 flex gap-3 my-5">
        <span className="flex-shrink-0 mt-0.5 text-base leading-none">
          &#x1F4A1;
        </span>
        <p className="text-sm text-cyan-900 leading-relaxed">
          <span className="font-semibold">Tip: </span>
          {renderFormattedText(block.content)}
        </p>
      </div>
    );
  }

  return (
    <p className="text-[15px] text-slate-600 leading-relaxed">
      {renderFormattedText(block.content)}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Article page
// ---------------------------------------------------------------------------

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  const articleIndex = articles.findIndex((a) => a.slug === slug);
  const article = articles[articleIndex];

  // 404 state
  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Article not found
          </h1>
          <p className="text-slate-500 mb-6 text-sm">
            The help article you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Help Center
          </Link>
        </div>
      </div>
    );
  }

  const prevArticle = articleIndex > 0 ? articles[articleIndex - 1] : null;
  const nextArticle =
    articleIndex < articles.length - 1 ? articles[articleIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto flex items-center gap-4 h-16 px-4 sm:px-6">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 rounded-md px-1"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Help Center</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center flex-wrap gap-1.5 text-xs text-slate-400 mb-6"
        >
          <Link
            href="/docs"
            className="hover:text-slate-600 transition-colors"
          >
            Help Center
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span>{article.sectionTitle}</span>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-slate-600">{article.title}</span>
        </nav>

        {/* Article */}
        <article>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            {article.title}
          </h1>

          <div className="space-y-4">
            {article.blocks.map((block, i) => (
              <ContentBlock key={i} block={block} />
            ))}
          </div>
        </article>

        {/* Prev / Next navigation */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-4">
          {prevArticle ? (
            <Link
              href={`/docs/${prevArticle.slug}`}
              className="group text-left"
            >
              <span className="text-xs text-slate-400 block mb-0.5">
                &larr; Previous
              </span>
              <p className="text-sm font-medium text-slate-700 group-hover:text-cyan-600 transition-colors">
                {prevArticle.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {nextArticle ? (
            <Link
              href={`/docs/${nextArticle.slug}`}
              className="group text-right"
            >
              <span className="text-xs text-slate-400 block mb-0.5">
                Next &rarr;
              </span>
              <p className="text-sm font-medium text-slate-700 group-hover:text-cyan-600 transition-colors">
                {nextArticle.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 mb-8 text-center border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500">
            Still have questions? Reach out at{" "}
            <a
              href="mailto:support@dockslot.app"
              className="text-cyan-600 hover:text-cyan-700 underline underline-offset-2"
            >
              support@dockslot.app
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

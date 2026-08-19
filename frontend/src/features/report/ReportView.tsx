import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Типографика отчёта. Плагина `@tailwindcss/typography` в проекте нет —
 * классы навешиваются поэлементно, зато без лишней зависимости и с полным
 * контролем над тем, как отчёт выглядит на проекторе.
 */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-8 mb-3 text-2xl font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 mb-3 border-b pb-1.5 text-lg font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-base font-semibold first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="my-3 leading-7">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 pl-4 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6" />,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 text-[0.85em]">{children}</code>
  ),
  a: ({ href, children }) => (
    <a href={href} className="underline underline-offset-4">
      {children}
    </a>
  ),
  // Таблицы приходят из GFM — за них отвечает remark-gfm, без него это был бы текст.
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b bg-muted/50">{children}</thead>,
  tr: ({ children }) => <tr className="border-b last:border-0">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-medium">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 tabular-nums">{children}</td>,
};

export function ReportView({ markdown }: { markdown: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {markdown}
    </Markdown>
  );
}

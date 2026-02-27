import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server';
import { PrintActions } from './PrintActions';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Replace waiver template variables with blank lines for print forms.
 */
function replaceVariablesWithBlanks(content: string): string {
  return content.replace(
    /\{\{[a-z_]+\}\}/gi,
    '________________'
  );
}

/**
 * Format waiver content with markdown-like syntax into React elements.
 * Mirrors the formatting logic from WaiverDocument but styled for print.
 */
function formatContent(text: string) {
  return text.split('\n\n').map((paragraph, i) => {
    // Headers
    if (paragraph.startsWith('### ')) {
      return (
        <h4 key={i} className="waiver-h3">
          {paragraph.slice(4)}
        </h4>
      );
    }
    if (paragraph.startsWith('## ')) {
      return (
        <h3 key={i} className="waiver-h2">
          {paragraph.slice(3)}
        </h3>
      );
    }
    if (paragraph.startsWith('# ')) {
      return (
        <h2 key={i} className="waiver-h1">
          {paragraph.slice(2)}
        </h2>
      );
    }

    // Bullet lists
    if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
      const items = paragraph.split('\n').filter((line) => line.startsWith('- '));
      return (
        <ul key={i} className="waiver-list">
          {items.map((item, j) => (
            <li key={j}>{formatInline(item.slice(2))}</li>
          ))}
        </ul>
      );
    }

    // Numbered lists
    if (/^\d+\.\s/.test(paragraph)) {
      const items = paragraph.split('\n').filter((line) => /^\d+\.\s/.test(line));
      return (
        <ol key={i} className="waiver-list-numbered">
          {items.map((item, j) => (
            <li key={j}>{formatInline(item.replace(/^\d+\.\s/, ''))}</li>
          ))}
        </ol>
      );
    }

    // Regular paragraph with inline formatting
    const processedText = paragraph
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');

    return (
      <p
        key={i}
        className="waiver-paragraph"
        dangerouslySetInnerHTML={{ __html: processedText }}
      />
    );
  });
}

/**
 * Process inline formatting (bold, italic) and return safe HTML string.
 */
function formatInline(text: string): React.ReactElement {
  const processed = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  return <span dangerouslySetInnerHTML={{ __html: processed }} />;
}

export default async function WaiverPreviewPage({ params }: Props) {
  const { id } = await params;
  const { user, supabase } = await requireAuth();

  const { data: template, error } = await supabase
    .from('waiver_templates')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (error || !template) {
    notFound();
  }

  // Fetch captain's profile for business name
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, full_name')
    .eq('id', user.id)
    .single();

  const businessName = profile?.business_name || profile?.full_name || '';
  const printContent = replaceVariablesWithBlanks(template.content);

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          /* Hide everything in the dashboard layout except the waiver */
          body * {
            visibility: hidden;
          }
          .waiver-preview-container,
          .waiver-preview-container * {
            visibility: visible;
          }
          .waiver-preview-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          /* Page setup for letter paper */
          @page {
            size: letter;
            margin: 0.75in;
          }

          /* Typography for print */
          .waiver-preview-container {
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            background: #fff;
          }
          .waiver-title {
            font-size: 16pt;
            font-weight: 700;
            text-align: center;
            margin-bottom: 6pt;
            color: #000;
          }
          .waiver-business-name {
            font-size: 11pt;
            text-align: center;
            margin-bottom: 18pt;
            color: #333;
          }
          .waiver-h1 {
            font-size: 14pt;
            font-weight: 700;
            margin-top: 14pt;
            margin-bottom: 6pt;
          }
          .waiver-h2 {
            font-size: 13pt;
            font-weight: 600;
            margin-top: 12pt;
            margin-bottom: 5pt;
          }
          .waiver-h3 {
            font-size: 12pt;
            font-weight: 600;
            margin-top: 10pt;
            margin-bottom: 4pt;
          }
          .waiver-paragraph {
            margin-top: 4pt;
            margin-bottom: 4pt;
          }
          .waiver-list,
          .waiver-list-numbered {
            margin-top: 4pt;
            margin-bottom: 4pt;
            padding-left: 20pt;
          }
          .waiver-list {
            list-style-type: disc;
          }
          .waiver-list-numbered {
            list-style-type: decimal;
          }
          .waiver-list li,
          .waiver-list-numbered li {
            margin-bottom: 2pt;
          }
          .waiver-signature-section {
            margin-top: 30pt;
            border-top: 1pt solid #ccc;
            padding-top: 16pt;
          }
          .waiver-footer {
            margin-top: 24pt;
            font-size: 9pt;
            text-align: center;
            color: #999;
          }
        }

        /* Screen styles for preview */
        @media screen {
          .waiver-title {
            font-size: 1.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 0.25rem;
            color: #0f172a;
          }
          .waiver-business-name {
            font-size: 0.875rem;
            text-align: center;
            margin-bottom: 1.5rem;
            color: #64748b;
          }
          .waiver-h1 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-top: 1.25rem;
            margin-bottom: 0.5rem;
            color: #0f172a;
          }
          .waiver-h2 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            color: #0f172a;
          }
          .waiver-h3 {
            font-size: 1rem;
            font-weight: 600;
            margin-top: 0.75rem;
            margin-bottom: 0.25rem;
            color: #0f172a;
          }
          .waiver-paragraph {
            margin-top: 0.375rem;
            margin-bottom: 0.375rem;
            color: #334155;
            line-height: 1.7;
          }
          .waiver-list,
          .waiver-list-numbered {
            margin-top: 0.375rem;
            margin-bottom: 0.375rem;
            padding-left: 1.5rem;
            color: #334155;
          }
          .waiver-list {
            list-style-type: disc;
          }
          .waiver-list-numbered {
            list-style-type: decimal;
          }
          .waiver-list li,
          .waiver-list-numbered li {
            margin-bottom: 0.25rem;
            line-height: 1.6;
          }
        }
      `}</style>

      <PrintActions />

      <div className="waiver-preview-container max-w-3xl mx-auto bg-white rounded-lg border border-slate-200 shadow-sm p-8 sm:p-12">
        {/* Title */}
        <h1 className="waiver-title">{template.title}</h1>

        {businessName && (
          <p className="waiver-business-name">{businessName}</p>
        )}

        <hr className="border-slate-200 mb-6 print:border-slate-300" />

        {/* Waiver Content */}
        <div>{formatContent(printContent)}</div>

        {/* Signature Section */}
        <div className="waiver-signature-section mt-10 border-t border-slate-200 pt-6">
          <div className="space-y-6">
            <div>
              <p className="text-slate-700 print:text-black">
                Signature: ________________&nbsp;&nbsp;&nbsp;&nbsp;Date: ________________
              </p>
            </div>
            <div>
              <p className="text-slate-700 print:text-black">
                Printed Name: ________________
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="waiver-footer mt-8 text-center text-xs text-slate-400">
          {businessName && <span>{businessName} &middot; </span>}
          Powered by DockSlot
        </div>
      </div>
    </>
  );
}

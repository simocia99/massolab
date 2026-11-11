// Minimal HTML editor replacing react-quill (not installed). Produces the same
// kind of HTML (p, h2, h3, strong, em, u, ul/ol, a, blockquote).
import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Link2, Quote, RemoveFormatting } from 'lucide-react';

const TOOLS = [
  { cmd: 'bold', icon: Bold, label: 'Grassetto' },
  { cmd: 'italic', icon: Italic, label: 'Corsivo' },
  { cmd: 'underline', icon: Underline, label: 'Sottolineato' },
  { cmd: 'formatBlock', arg: 'H2', icon: Heading2, label: 'Titolo' },
  { cmd: 'formatBlock', arg: 'H3', icon: Heading3, label: 'Sottotitolo' },
  { cmd: 'insertUnorderedList', icon: List, label: 'Elenco puntato' },
  { cmd: 'insertOrderedList', icon: ListOrdered, label: 'Elenco numerato' },
  { cmd: 'formatBlock', arg: 'BLOCKQUOTE', icon: Quote, label: 'Citazione' },
  { cmd: 'createLink', icon: Link2, label: 'Link' },
  { cmd: 'removeFormat', icon: RemoveFormatting, label: 'Rimuovi formattazione' },
];

export default function RichTextEditor({ value, onChange, minHeight = 280 }) {
  const ref = useRef(null);

  // Only push external value into the DOM when it differs (keeps the caret stable while typing).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) ref.current.innerHTML = value || '';
  }, [value]);

  const emit = () => {
    const html = ref.current?.innerHTML || '';
    onChange(html === '<br>' ? '' : html);
  };

  const run = (tool) => {
    ref.current?.focus();
    if (tool.cmd === 'createLink') {
      const url = window.prompt('Indirizzo del link (https://...)');
      if (!url || !/^(https?:|mailto:|\/)/i.test(url.trim())) return;
      document.execCommand('createLink', false, url.trim());
    } else if (tool.cmd === 'formatBlock') {
      document.execCommand('formatBlock', false, tool.arg);
    } else {
      document.execCommand(tool.cmd, false, null);
    }
    emit();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(t)}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
          >
            <t.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Contenuto"
        onInput={emit}
        onBlur={emit}
        style={{ minHeight }}
        className="px-4 py-3 text-sm text-gray-800 focus:outline-none prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-red-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-3 [&_blockquote]:italic"
      />
    </div>
  );
}

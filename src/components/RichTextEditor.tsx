/**
 * RichTextEditor.tsx
 * A lightweight, self-contained rich-text editor built on contentEditable.
 * No external deps — works entirely in-browser.
 *
 * Toolbar: Bold · Italic · Underline · H1 · H2 · H3 · UL · OL · Link · Blockquote · Clear formatting
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, Link, Quote,
  Heading1, Heading2, Heading3, RemoveFormatting, Undo, Redo,
  Type,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  disabled?: boolean;
}

type FormatCmd =
  | 'bold' | 'italic' | 'underline'
  | 'insertUnorderedList' | 'insertOrderedList'
  | 'blockquote' | 'removeFormat'
  | 'undo' | 'redo';

function ToolbarBtn({
  title, active, onClick, children, disabled,
}: {
  title: string; active?: boolean; onClick: () => void;
  children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded transition-colors text-xs font-bold
        ${active
          ? 'bg-primary text-black'
          : 'text-zinc-400 hover:text-white hover:bg-white/10'}
        ${disabled ? 'opacity-40 pointer-events-none' : ''}
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-white/10 mx-1 self-center" />;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Inhalt eingeben…',
  minHeight = 400,
  className = '',
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const savedRange = useRef<Range | null>(null);

  // Sync external value → DOM (only when it actually changes externally)
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastValueRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (html !== lastValueRef.current) {
      lastValueRef.current = html;
      onChange(html);
    }
  }, [onChange]);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    emitChange();
  }, [emitChange]);

  const setHeading = useCallback((tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    emitChange();
  }, [emitChange]);

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const handleLinkInsert = () => {
    if (!savedRange.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    editorRef.current?.focus();
    const url = linkUrl.trim();
    if (url && url !== 'https://') {
      document.execCommand('createLink', false, url);
      // Make links open in new tab
      const links = editorRef.current?.querySelectorAll('a');
      links?.forEach(a => {
        if (a.href === url || a.getAttribute('href') === url) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        }
      });
    }
    emitChange();
    setLinkModalOpen(false);
    setLinkUrl('https://');
  };

  const openLinkModal = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
    setLinkModalOpen(true);
  };

  return (
    <div className={`flex flex-col border border-[#222] rounded-sm overflow-hidden ${className}`}>
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-[#0d0d0d] border-b border-[#222] sticky top-0 z-10">
        {/* Undo / Redo */}
        <ToolbarBtn title="Rückgängig (Ctrl+Z)" onClick={() => exec('undo')} disabled={disabled}>
          <Undo size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Wiederholen (Ctrl+Y)" onClick={() => exec('redo')} disabled={disabled}>
          <Redo size={14} />
        </ToolbarBtn>
        <Divider />

        {/* Headings */}
        <ToolbarBtn title="Überschrift 1" onClick={() => setHeading('h1')} disabled={disabled}>
          <Heading1 size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Überschrift 2" onClick={() => setHeading('h2')} disabled={disabled}>
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Überschrift 3" onClick={() => setHeading('h3')} disabled={disabled}>
          <Heading3 size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Absatz" onClick={() => setHeading('p')} disabled={disabled}>
          <Type size={14} />
        </ToolbarBtn>
        <Divider />

        {/* Inline formatting */}
        <ToolbarBtn title="Fett (Ctrl+B)" active={isActive('bold')} onClick={() => exec('bold')} disabled={disabled}>
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Kursiv (Ctrl+I)" active={isActive('italic')} onClick={() => exec('italic')} disabled={disabled}>
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Unterstrichen (Ctrl+U)" active={isActive('underline')} onClick={() => exec('underline')} disabled={disabled}>
          <Underline size={14} />
        </ToolbarBtn>
        <Divider />

        {/* Lists */}
        <ToolbarBtn title="Aufzählungsliste" active={isActive('insertUnorderedList')} onClick={() => exec('insertUnorderedList')} disabled={disabled}>
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Nummerierte Liste" active={isActive('insertOrderedList')} onClick={() => exec('insertOrderedList')} disabled={disabled}>
          <ListOrdered size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Zitat" onClick={() => setHeading('blockquote')} disabled={disabled}>
          <Quote size={14} />
        </ToolbarBtn>
        <Divider />

        {/* Link */}
        <ToolbarBtn title="Link einfügen" onClick={openLinkModal} disabled={disabled}>
          <Link size={14} />
        </ToolbarBtn>
        <Divider />

        {/* Clear */}
        <ToolbarBtn title="Formatierung entfernen" onClick={() => exec('removeFormat')} disabled={disabled}>
          <RemoveFormatting size={14} />
        </ToolbarBtn>
      </div>

      {/* ── Editor surface ───────────────────────────────────────────────── */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        onKeyDown={e => {
          // Ctrl+S → blur to trigger save upstream
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            editorRef.current?.blur();
          }
        }}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={`
          px-6 py-5 bg-[#0a0a0a] text-white text-sm leading-relaxed
          outline-none overflow-y-auto
          focus:bg-[#090909]
          prose prose-invert prose-sm max-w-none
          [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-3
          [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-white [&_h2]:mt-5 [&_h2]:mb-2
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-zinc-200 [&_h3]:mt-4 [&_h3]:mb-2
          [&_p]:text-zinc-300 [&_p]:my-2 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:text-zinc-300
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:text-zinc-300
          [&_li]:my-1
          [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80
          [&_strong]:text-white [&_strong]:font-bold
          [&_em]:italic [&_em]:text-zinc-300
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4
          [&_blockquote]:text-zinc-400 [&_blockquote]:italic [&_blockquote]:my-4
          empty:before:content-[attr(data-placeholder)]
          empty:before:text-zinc-700 empty:before:pointer-events-none
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      />

      {/* ── Link Modal ──────────────────────────────────────────────────── */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-[#333] rounded-sm p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Link einfügen</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLinkInsert(); } }}
              className="w-full bg-[#0a0a0a] border border-[#333] p-3 rounded-sm text-sm text-white outline-none focus:border-primary"
              placeholder="https://example.com"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleLinkInsert}
                className="flex-1 bg-primary text-black font-black text-xs uppercase tracking-widest py-2.5 rounded-sm hover:bg-primary/90 transition-colors"
              >
                Einfügen
              </button>
              <button
                type="button"
                onClick={() => { setLinkModalOpen(false); setLinkUrl('https://'); }}
                className="flex-1 bg-[#222] text-zinc-400 font-black text-xs uppercase tracking-widest py-2.5 rounded-sm hover:bg-[#2a2a2a] transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

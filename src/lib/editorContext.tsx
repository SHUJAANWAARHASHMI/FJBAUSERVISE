/**
 * Editor Context — shared between SiteEditor and all real frontend components.
 *
 * When `isEditing` is true, every component uses `useEditorField` to:
 *   - render text nodes as contentEditable spans
 *   - render images with an upload overlay
 *   - call `save(fieldPath, value)` on blur → persists to Supabase + updates local state
 *
 * Components are completely unaffected when `isEditing` is false (normal visitors).
 */

import React, {
  createContext, useContext, useRef, useEffect, useState, useCallback
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EditorContextValue {
  isEditing: boolean;
  /** Live settings state — components read from here while editing */
  settings: any;
  /** Immediately update a settings field in memory */
  patchSettings: (key: string, value: any) => void;
  /** Upload an image file → returns public URL */
  uploadImage: (fieldKey: string, file: File) => Promise<string | null>;
  /** Which field key is currently uploading */
  uploadingField: string | null;
  /** Selected section id for outline highlight */
  selectedSection: string | null;
  setSelectedSection: (id: string | null) => void;
}

export const EditorContext = createContext<EditorContextValue>({
  isEditing: false,
  settings: {},
  patchSettings: () => {},
  uploadImage: async () => null,
  uploadingField: null,
  selectedSection: null,
  setSelectedSection: () => {},
});

export const useEditorCtx = () => useContext(EditorContext);

// ─── EditableText ─────────────────────────────────────────────────────────────
/**
 * Renders children as-is on the live website.
 * In editor mode, wraps in a contentEditable element.
 *
 * Usage:
 *   <EditableText field="hero_heading_de" tag="h1" className="...">
 *     {value}
 *   </EditableText>
 */
export function EditableText({
  field,
  value,
  tag = 'span',
  className,
  placeholder,
  multiline = false,
  children,
  style,
}: {
  field: string;
  value: string;
  tag?: keyof JSX.IntrinsicElements;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { isEditing, patchSettings } = useEditorCtx();
  const ref = useRef<HTMLElement>(null);
  const [focused, setFocused] = useState(false);

  // Keep DOM in sync with value ONLY on initial mount or external value changes
  // NEVER overwrite while the user is focused (typing)
  const lastExternalValue = useRef(value);
  useEffect(() => {
    if (!focused && ref.current) {
      // Only update DOM if the external value actually changed
      // This prevents server responses from overwriting in-progress edits
      if (value !== lastExternalValue.current) {
        lastExternalValue.current = value;
        ref.current.innerText = value ?? '';
      }
    }
  }, [value, focused]);

  if (!isEditing) {
    const Tag = tag as any;
    return (
      <Tag className={className} style={style}>
        {children ?? value}
      </Tag>
    );
  }

  const Tag = tag as any;
  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-editor-field={field}
      data-placeholder={placeholder || 'Klicken zum Bearbeiten…'}
      onFocus={() => setFocused(true)}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        setFocused(false);
        const newVal = e.currentTarget.innerText;
        if (newVal !== value) patchSettings(field, newVal);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (!multiline && e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); }
      }}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      className={[
        className,
        'outline-none cursor-text',
        'focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:rounded-sm',
        'hover:outline hover:outline-1 hover:outline-primary/50 hover:rounded-sm',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic empty:before:font-normal',
        'transition-all',
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {value}
    </Tag>
  );
}

// ─── EditableImage ─────────────────────────────────────────────────────────────
/**
 * Renders a normal <img> on the live site.
 * In editor mode, adds a hover overlay with upload/drag-drop support.
 */
export function EditableImage({
  field,
  src,
  alt,
  className,
  style,
  imgClassName,
  imgStyle,
  objectFit = 'cover',
  children,
}: {
  field: string;
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill';
  children?: React.ReactNode;
}) {
  const { isEditing, patchSettings, uploadImage, uploadingField } = useEditorCtx();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const uploading = uploadingField === field;

  const handleFile = useCallback(async (file: File) => {
    const url = await uploadImage(field, file);
    if (url) patchSettings(field, url);
  }, [field, uploadImage, patchSettings]);

  if (!isEditing) {
    if (children) {
      return (
        <div className={className} style={style}>
          {src ? <img src={src} alt={alt} className={imgClassName} style={imgStyle} /> : null}
          {children}
        </div>
      );
    }
    return <img src={src} alt={alt} className={className} style={{ ...style, objectFit: objectFit as any }} />;
  }

  const Wrapper = children ? 'div' : 'div';
  return (
    <Wrapper
      className={`relative group/edimg cursor-pointer ${className || ''}`}
      style={style}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); fileRef.current?.click(); }}
      onDragOver={(e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f?.type.startsWith('image/')) handleFile(f);
      }}
    >
      {src
        ? <img src={src} alt={alt} className={imgClassName || 'w-full h-full'} style={{ objectFit: objectFit as any, ...imgStyle }} />
        : <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${imgClassName || ''}`} style={imgStyle}>
            <span className="text-gray-400 text-xs font-bold">Kein Bild</span>
          </div>
      }
      {children}

      {/* Edit overlay */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity z-20 pointer-events-none
        ${dragging || uploading ? 'opacity-100 bg-primary/60' : 'opacity-0 group-hover/edimg:opacity-100 bg-black/50'}`}>
        {uploading
          ? <svg className="animate-spin w-8 h-8 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          : <>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              <span className="text-white text-[11px] font-black uppercase tracking-wider text-center px-2">
                {dragging ? 'Loslassen' : 'Bild ersetzen'}
              </span>
            </>
        }
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </Wrapper>
  );
}

// ─── EditableSection ──────────────────────────────────────────────────────────
/**
 * Wraps a section with an outline + label badge in editor mode.
 */
export function EditableSection({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const { isEditing, selectedSection, setSelectedSection } = useEditorCtx();

  if (!isEditing) return <>{children}</>;

  const isSelected = selectedSection === id;
  return (
    <div
      className={`relative group/sec transition-all duration-150
        ${isSelected
          ? 'outline outline-2 outline-primary outline-offset-0'
          : 'hover:outline hover:outline-1 hover:outline-primary/40'}`}
      onClick={e => { e.stopPropagation(); setSelectedSection(id); }}
    >
      {/* Label badge — always visible when selected, hover otherwise */}
      <div className={`absolute top-0 left-0 z-30 pointer-events-none transition-opacity
        ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/sec:opacity-100'}`}>
        <div className="bg-primary text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
          ✏️ {label}
        </div>
      </div>
      {children}
    </div>
  );
}

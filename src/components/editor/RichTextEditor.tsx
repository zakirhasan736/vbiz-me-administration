'use client'

import { HoistableStyle } from '@/lib/dom/HoistableStyle'
import {
  isThemeNeutralColor,
  normalizeRichTextHtml,
  shouldDefaultToParagraph,
} from '@/lib/editor/normalizeRichTextHtml'
import { useVCard } from '@/lib/VCardContext'
import { cn } from '@/utils/cn'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TextAlign } from '@tiptap/extension-text-align'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import { Underline } from '@tiptap/extension-underline'
import { Youtube } from '@tiptap/extension-youtube'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import {
  AlignLeft,
  Bold,
  Braces,
  ChevronDown,
  Code2,
  FileCode,
  Highlighter,
  Image as ImageIcon,
  Indent,
  Italic,
  Link2,
  List,
  ListOrdered,
  Outdent,
  Quote,
  RemoveFormatting,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Type,
  Underline as UnderlineIcon,
  Video,
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type RichTextEditorProps = {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  minHeightClassName?: string
  disabled?: boolean
  /** Bold text and highlight follow this color. Defaults to the card accent. */
  accentColor?: string
}

type ToolbarBtnProps = {
  active?: boolean
  disabled?: boolean
  title: string
  onClick: () => void
  children: ReactNode
}

function ToolbarBtn({ active, disabled, title, onClick, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors dark:text-slate-300',
        active
          ? 'bg-slate-200 text-slate-900 dark:bg-white/15 dark:text-white'
          : 'hover:bg-slate-100 dark:hover:bg-white/10',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block dark:bg-white/10" aria-hidden />
}

const HEADING_OPTIONS: { label: string; level: 0 | 1 | 2 | 3 | 4 | 5 | 6 }[] = [
  { label: 'Paragraph', level: 0 },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
  { label: 'Heading 4', level: 4 },
  { label: 'Heading 5', level: 5 },
  { label: 'Heading 6', level: 6 },
]

const TEXT_COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#eab308']
const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8', '#ddd6fe', '#fed7aa', '#e5e7eb']

const ALIGN_OPTIONS: { label: string; value: 'left' | 'center' | 'right' | 'justify' }[] = [
  { label: 'Align left', value: 'left' },
  { label: 'Align center', value: 'center' },
  { label: 'Align right', value: 'right' },
  { label: 'Justify', value: 'justify' },
]

const EDITOR_ACCENT_CSS = `
.vcard-rich-editor h1 { font-size: 1.875rem; font-weight: 800; line-height: 1.2; margin: 0.6em 0 0.3em; }
.vcard-rich-editor h2 { font-size: 1.5rem; font-weight: 800; line-height: 1.25; margin: 0.6em 0 0.3em; }
.vcard-rich-editor h3 { font-size: 1.25rem; font-weight: 700; line-height: 1.3; margin: 0.55em 0 0.25em; }
.vcard-rich-editor h4 { font-size: 1.125rem; font-weight: 700; line-height: 1.35; margin: 0.5em 0 0.25em; }
.vcard-rich-editor h5 { font-size: 1rem; font-weight: 700; line-height: 1.4; margin: 0.45em 0 0.2em; }
.vcard-rich-editor h6 { font-size: 0.875rem; font-weight: 700; line-height: 1.4; margin: 0.4em 0 0.2em; letter-spacing: 0.02em; }
.vcard-rich-editor p { margin: 0.35em 0; color: inherit; }
.vcard-rich-editor h1, .vcard-rich-editor h2, .vcard-rich-editor h3,
.vcard-rich-editor h4, .vcard-rich-editor h5, .vcard-rich-editor h6 { color: inherit; }
.vcard-rich-editor [style*='color: rgb(0, 0, 0)'],
.vcard-rich-editor [style*='color:rgb(0, 0, 0)'],
.vcard-rich-editor [style*='color: rgb(0,0,0)'],
.vcard-rich-editor [style*='color:#000'],
.vcard-rich-editor [style*='color: #000000'],
.vcard-rich-editor [style*='color: black'] { color: inherit !important; }
.vcard-rich-editor strong, .vcard-rich-editor b {
  color: var(--rte-accent, #eab308);
  font-weight: 900 !important;
}
/* When text color wraps bold, inherit the picker color instead of accent. */
.vcard-rich-editor [style*='color'] strong,
.vcard-rich-editor [style*='color'] b {
  color: inherit;
}
.vcard-rich-editor em, .vcard-rich-editor i { font-style: italic; }
.vcard-rich-editor u { text-decoration: underline; }
.vcard-rich-editor s, .vcard-rich-editor strike, .vcard-rich-editor del { text-decoration: line-through; }
.vcard-rich-editor mark { color: inherit; }
.vcard-rich-editor mark:not([style*='background']) {
  background-color: color-mix(in srgb, var(--rte-accent, #eab308) 42%, white);
}
.vcard-rich-editor a { color: var(--rte-accent, #eab308); text-decoration: underline; }
.vcard-rich-editor ul { list-style: disc; padding-left: 1.25rem; margin: 0.4em 0; }
.vcard-rich-editor ol { list-style: decimal; padding-left: 1.25rem; margin: 0.4em 0; }
.vcard-rich-editor li { margin: 0.15em 0; }
.vcard-rich-editor blockquote { border-left: 3px solid var(--rte-accent, #eab308); padding-left: 0.75rem; margin: 0.6em 0; }
.vcard-rich-editor code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; background: #f1f5f9; border-radius: 0.25rem; padding: 0.1em 0.35em; }
.vcard-rich-editor pre { margin: 0.6em 0; padding: 0.75rem 1rem; border-radius: 0.75rem; background: #0f172a; color: #e2e8f0; overflow-x: auto; }
.vcard-rich-editor pre code { background: transparent; color: inherit; padding: 0; }
.vcard-rich-editor img { max-width: 100%; height: auto; border-radius: 0.75rem; }
.vcard-rich-editor sub { font-size: 0.75em; vertical-align: sub; }
.vcard-rich-editor sup { font-size: 0.75em; vertical-align: super; }
`

function currentHeadingLabel(editor: Editor): string {
  for (const opt of HEADING_OPTIONS) {
    if (opt.level === 0) {
      if (editor.isActive('paragraph')) return opt.label
    } else if (editor.isActive('heading', { level: opt.level })) {
      return opt.label
    }
  }
  return 'Paragraph'
}

/** Keep the current selection (or stored marks when collapsed). Never expand to the whole block. */
function chainForInlineMark(editor: Editor) {
  const { from, to, empty } = editor.state.selection
  const chain = editor.chain().focus()
  if (!empty) return chain.setTextSelection({ from, to })
  return chain
}

function applyTextColor(editor: Editor, color: string | null) {
  const chain = chainForInlineMark(editor)
  if (color && !isThemeNeutralColor(color)) {
    // setMark on textStyle — avoid Color.setColor which calls .run() internally and can drop chained selection.
    chain.setMark('textStyle', { color }).run()
    return
  }
  chain.setMark('textStyle', { color: null }).removeEmptyTextStyle().run()
}

function applyHighlightColor(editor: Editor, color: string | null) {
  const chain = chainForInlineMark(editor)
  if (!color) {
    chain.unsetHighlight().run()
    return
  }
  chain.setHighlight({ color }).run()
}

function toggleBoldMark(editor: Editor) {
  const chain = chainForInlineMark(editor)
  // Toggle only the current selection (or stored mark when caret is collapsed).
  chain.toggleBold().run()
}

function setLinkFromPrompt(editor: Editor) {
  const prev = editor.getAttributes('link').href as string | undefined
  const url = window.prompt('Enter URL', prev || 'https://')
  if (url === null) return
  const trimmed = url.trim()
  if (!trimmed) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
}

function applyTypographyBlock(editor: Editor, level: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
  const chain = editor.chain().focus().unsetColor()
  // Prefer setHeading over toggle so picking a style always applies (never toggles off).
  if (level === 0) chain.setParagraph().run()
  else chain.setHeading({ level }).run()
}

/**
 * WordPress-style floating bar — appears instantly when text is selected.
 * Bold / italic / underline / link / text size / text color / highlight.
 */
function SelectionBubbleMenu({ editor, accent }: { editor: Editor; accent: string }) {
  const [, setTick] = useState(0)
  const [panel, setPanel] = useState<'none' | 'size' | 'color' | 'highlight'>('none')

  useEffect(() => {
    const rerender = () => setTick((n) => n + 1)
    editor.on('selectionUpdate', rerender)
    editor.on('transaction', rerender)
    return () => {
      editor.off('selectionUpdate', rerender)
      editor.off('transaction', rerender)
    }
  }, [editor])

  useEffect(() => {
    const onSel = () => {
      if (editor.state.selection.empty) setPanel('none')
    }
    editor.on('selectionUpdate', onSel)
    return () => {
      editor.off('selectionUpdate', onSel)
    }
  }, [editor])

  const textColors = accent && !TEXT_COLORS.includes(accent) ? [accent, ...TEXT_COLORS] : TEXT_COLORS

  return (
    <BubbleMenu
      editor={editor}
      appendTo={() => document.body}
      updateDelay={0}
      options={{ placement: 'top', offset: 10, flip: true, shift: true, strategy: 'fixed' }}
      shouldShow={({ editor: ed, state }) => {
        const { from, to, empty } = state.selection
        if (empty || !ed.isEditable) return false
        if (ed.isActive('codeBlock')) return false
        return to - from > 0
      }}
      className="vbiz-rte-bubble flex max-w-[min(100vw-1.5rem,28rem)] flex-col gap-1 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#0b0f19]"
      style={{ zIndex: 10000 }}
    >
      <div className="flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          title="Text size"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setPanel((p) => (p === 'size' ? 'none' : 'size'))}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-slate-700 dark:text-slate-200',
            panel === 'size' ? 'bg-slate-200 dark:bg-white/15' : 'hover:bg-slate-100 dark:hover:bg-white/10'
          )}
        >
          <Type className="h-3.5 w-3.5" />
          {currentHeadingLabel(editor).replace('Heading ', 'H')}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        <ToolbarDivider />

        <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => toggleBoldMark(editor)}>
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => chainForInlineMark(editor).toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => chainForInlineMark(editor).toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Link" active={editor.isActive('link')} onClick={() => setLinkFromPrompt(editor)}>
          <Link2 className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          title="Text color"
          active={panel === 'color'}
          onClick={() => setPanel((p) => (p === 'color' ? 'none' : 'color'))}
        >
          <span className="relative inline-flex h-4 w-4 items-center justify-center">
            <Type className="h-3.5 w-3.5" />
            <span
              className="absolute right-0 bottom-0 h-1.5 w-1.5 rounded-full ring-1 ring-white dark:ring-[#0b0f19]"
              style={{ backgroundColor: (editor.getAttributes('textStyle').color as string) || accent }}
            />
          </span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Highlight / background"
          active={panel === 'highlight' || editor.isActive('highlight')}
          onClick={() => setPanel((p) => (p === 'highlight' ? 'none' : 'highlight'))}
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      {panel === 'size' ? (
        <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-1.5 dark:border-white/10">
          {HEADING_OPTIONS.map((opt) => {
            const active =
              opt.level === 0 ? !editor.isActive('heading') : editor.isActive('heading', { level: opt.level })
            return (
              <button
                key={opt.label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  applyTypographyBlock(editor, opt.level)
                  setPanel('none')
                }}
                className={cn(
                  'rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200',
                  active ? 'bg-slate-200 dark:bg-white/15' : 'hover:bg-slate-100 dark:hover:bg-white/10'
                )}
              >
                {opt.label.replace('Heading ', 'H').replace('Paragraph', 'P')}
              </button>
            )
          })}
        </div>
      ) : null}

      {panel === 'color' ? (
        <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 pt-1.5 dark:border-white/10">
          {textColors.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                applyTextColor(editor, c)
                setPanel('none')
              }}
              className="h-5 w-5 rounded-md border border-slate-200 dark:border-white/10"
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            type="button"
            title="Clear text color"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              applyTextColor(editor, null)
              setPanel('none')
            }}
            className="px-1.5 text-[10px] font-bold text-slate-500"
          >
            Clear
          </button>
        </div>
      ) : null}

      {panel === 'highlight' ? (
        <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 pt-1.5 dark:border-white/10">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                applyHighlightColor(editor, c)
                setPanel('none')
              }}
              className="h-5 w-5 rounded-md border border-slate-200 dark:border-white/10"
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            type="button"
            title="Accent highlight"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              applyHighlightColor(editor, accent)
              setPanel('none')
            }}
            className="h-5 w-5 rounded-md border border-slate-200 dark:border-white/10"
            style={{ backgroundColor: `color-mix(in srgb, ${accent} 45%, white)` }}
          />
          <button
            type="button"
            title="Clear highlight"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              applyHighlightColor(editor, null)
              setPanel('none')
            }}
            className="px-1.5 text-[10px] font-bold text-slate-500"
          >
            Clear
          </button>
        </div>
      ) : null}
    </BubbleMenu>
  )
}

/** Dropdown menus portaled to body so parent overflow-hidden panels cannot clip them. */
function useAnchoredMenuStyle(open: boolean, anchorRef: React.RefObject<HTMLElement | null>): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ display: 'none' })

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setStyle({ display: 'none' })
      return
    }
    const place = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const menuMaxHeight = 288
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const openUp = spaceBelow < 160 && rect.top > spaceBelow
      const top = openUp ? Math.max(8, rect.top - menuMaxHeight - 4) : rect.bottom + 4
      setStyle({
        position: 'fixed',
        top,
        left: Math.min(rect.left, window.innerWidth - 160),
        zIndex: 10000,
        maxHeight: Math.min(menuMaxHeight, openUp ? rect.top - 8 : spaceBelow),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchorRef, open])

  return style
}

function RichTextToolbar({
  editor,
  sourceMode,
  onToggleSource,
}: {
  editor: Editor
  sourceMode: boolean
  onToggleSource: () => void
}) {
  const [, setTick] = useState(0)
  const [headingOpen, setHeadingOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [highlightOpen, setHighlightOpen] = useState(false)
  const [alignOpen, setAlignOpen] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const colorRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const alignRef = useRef<HTMLDivElement>(null)
  const headingMenuRef = useRef<HTMLDivElement>(null)
  const colorMenuRef = useRef<HTMLDivElement>(null)
  const highlightMenuRef = useRef<HTMLDivElement>(null)
  const alignMenuRef = useRef<HTMLDivElement>(null)
  const headingMenuStyle = useAnchoredMenuStyle(headingOpen, headingRef)
  const colorMenuStyle = useAnchoredMenuStyle(colorOpen, colorRef)
  const highlightMenuStyle = useAnchoredMenuStyle(highlightOpen, highlightRef)
  const alignMenuStyle = useAnchoredMenuStyle(alignOpen, alignRef)
  const canPortal = typeof document !== 'undefined'

  useEffect(() => {
    const rerender = () => setTick((n) => n + 1)
    editor.on('selectionUpdate', rerender)
    editor.on('transaction', rerender)
    return () => {
      editor.off('selectionUpdate', rerender)
      editor.off('transaction', rerender)
    }
  }, [editor])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      const inHeading = headingRef.current?.contains(t) || headingMenuRef.current?.contains(t)
      const inColor = colorRef.current?.contains(t) || colorMenuRef.current?.contains(t)
      const inHighlight = highlightRef.current?.contains(t) || highlightMenuRef.current?.contains(t)
      const inAlign = alignRef.current?.contains(t) || alignMenuRef.current?.contains(t)
      if (!inHeading) setHeadingOpen(false)
      if (!inColor) setColorOpen(false)
      if (!inHighlight) setHighlightOpen(false)
      if (!inAlign) setAlignOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const setLink = useCallback(() => setLinkFromPrompt(editor), [editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL', 'https://')
    if (!url?.trim()) return
    editor.chain().focus().setImage({ src: url.trim() }).run()
  }, [editor])

  const addVideo = useCallback(() => {
    const url = window.prompt('YouTube or video URL', 'https://')
    if (!url?.trim()) return
    const trimmed = url.trim()
    if (/youtu(\.be|be\.com)/i.test(trimmed)) {
      editor.commands.setYoutubeVideo({ src: trimmed })
      return
    }
    editor
      .chain()
      .focus()
      .insertContent(
        `<p><a href="${trimmed.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${trimmed}</a></p>`
      )
      .run()
  }, [editor])

  return (
    <div className="flex flex-col gap-1.5 border-b border-slate-200/80 bg-slate-50/80 px-2 py-2 dark:border-white/10 dark:bg-white/3">
      <div className="flex flex-wrap items-center gap-0.5">
        <div className="relative" ref={headingRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setColorOpen(false)
              setHighlightOpen(false)
              setAlignOpen(false)
              setHeadingOpen((o) => !o)
            }}
            aria-haspopup="listbox"
            aria-expanded={headingOpen}
            className="inline-flex h-8 min-w-32 items-center justify-between gap-1 rounded-lg px-2 text-[12px] font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 shrink-0" />
              {currentHeadingLabel(editor)}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </button>
          {headingOpen && canPortal
            ? createPortal(
                <div
                  ref={headingMenuRef}
                  role="listbox"
                  aria-label="Text style"
                  style={headingMenuStyle}
                  className="min-w-40 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#0b0f19]"
                >
                  {HEADING_OPTIONS.map((opt) => {
                    const active =
                      opt.level === 0 ? !editor.isActive('heading') : editor.isActive('heading', { level: opt.level })
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          applyTypographyBlock(editor, opt.level)
                          setHeadingOpen(false)
                        }}
                        className={cn(
                          'block w-full px-3 py-2 text-left text-[12px] font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5',
                          active && 'bg-slate-100 dark:bg-white/10'
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>,
                document.body
              )
            : null}
        </div>

        <ToolbarDivider />

        <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => toggleBoldMark(editor)}>
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => chainForInlineMark(editor).toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => chainForInlineMark(editor).toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => chainForInlineMark(editor).toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          title="Blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Inline code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Code block"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <FileCode className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Bulleted list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          title="Subscript"
          active={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Superscript"
          active={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          title="Decrease indent"
          onClick={() => {
            if (editor.can().liftListItem('listItem')) editor.chain().focus().liftListItem('listItem').run()
            else editor.chain().focus().setTextAlign('left').run()
          }}
        >
          <Outdent className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Increase indent"
          onClick={() => {
            if (editor.can().sinkListItem('listItem')) editor.chain().focus().sinkListItem('listItem').run()
          }}
        >
          <Indent className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <div className="relative" ref={alignRef}>
          <ToolbarBtn
            title="Text alignment"
            active={alignOpen}
            onClick={() => {
              setHeadingOpen(false)
              setColorOpen(false)
              setHighlightOpen(false)
              setAlignOpen((open) => !open)
            }}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarBtn>
          {alignOpen && canPortal
            ? createPortal(
                <div
                  ref={alignMenuRef}
                  style={alignMenuStyle}
                  className="min-w-36 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#0b0f19]"
                >
                  {ALIGN_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        editor.chain().focus().setTextAlign(opt.value).run()
                        setAlignOpen(false)
                      }}
                      className={cn(
                        'block w-full px-3 py-2 text-left text-[12px] font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5',
                        editor.isActive({ textAlign: opt.value }) && 'bg-slate-100 dark:bg-white/10'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>,
                document.body
              )
            : null}
        </div>

        <div className="relative" ref={colorRef}>
          <ToolbarBtn
            title="Text color"
            active={colorOpen}
            onClick={() => {
              setHeadingOpen(false)
              setAlignOpen(false)
              setHighlightOpen(false)
              setColorOpen((o) => !o)
            }}
          >
            <Type className="h-4 w-4" />
          </ToolbarBtn>
          {colorOpen && canPortal
            ? createPortal(
                <div
                  ref={colorMenuRef}
                  style={colorMenuStyle}
                  className="flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#0b0f19]"
                >
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={c}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyTextColor(editor, c)
                        setColorOpen(false)
                      }}
                      className="h-5 w-5 rounded-md border border-slate-200 dark:border-white/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <button
                    type="button"
                    title="Reset color"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      applyTextColor(editor, null)
                      setColorOpen(false)
                    }}
                    className="px-1 text-[10px] font-bold text-slate-500"
                  >
                    Clear
                  </button>
                </div>,
                document.body
              )
            : null}
        </div>

        <div className="relative" ref={highlightRef}>
          <ToolbarBtn
            title="Highlight"
            active={highlightOpen || editor.isActive('highlight')}
            onClick={() => {
              setHeadingOpen(false)
              setAlignOpen(false)
              setColorOpen(false)
              setHighlightOpen((o) => !o)
            }}
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarBtn>
          {highlightOpen && canPortal
            ? createPortal(
                <div
                  ref={highlightMenuRef}
                  style={highlightMenuStyle}
                  className="flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#0b0f19]"
                >
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={c}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyHighlightColor(editor, c)
                        setHighlightOpen(false)
                      }}
                      className="h-5 w-5 rounded-md border border-slate-200 dark:border-white/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <button
                    type="button"
                    title="Clear highlight"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      applyHighlightColor(editor, null)
                      setHighlightOpen(false)
                    }}
                    className="px-1 text-[10px] font-bold text-slate-500"
                  >
                    Clear
                  </button>
                </div>,
                document.body
              )
            : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-0.5">
        <ToolbarBtn title="Insert link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Insert image" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Insert video" onClick={addVideo}>
          <Video className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn title="Code view" active={sourceMode} onClick={onToggleSource}>
          <Braces className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().setParagraph().run()}
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarBtn>
      </div>
    </div>
  )
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write a detailed description…',
  className,
  minHeightClassName = 'min-h-56',
  disabled = false,
  accentColor,
}: RichTextEditorProps) {
  const { vCardData } = useVCard()
  const accent =
    accentColor?.trim() || vCardData.theme?.accentColor?.trim() || vCardData.theme?.primaryColor?.trim() || '#eab308'
  const onChangeRef = useRef(onChange)
  const editorRef = useRef<Editor | null>(null)
  const [sourceMode, setSourceMode] = useState(false)
  const [sourceDraft, setSourceDraft] = useState(value || '')
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: false,
        underline: false,
      }),
      Underline,
      TextStyle.configure({ mergeNestedSpanStyles: true }),
      Color.configure({ types: ['textStyle'] }),
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ allowBase64: false }),
      Youtube.configure({
        modestBranding: true,
        HTMLAttributes: { class: 'vcard-rich-youtube' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: normalizeRichTextHtml(value || ''),
    onCreate: ({ editor: ed }: { editor: Editor }) => {
      editorRef.current = ed
      if (shouldDefaultToParagraph(ed)) ed.commands.setParagraph()
    },
    // Do not run setParagraph on every focus — on iOS that fights tap-to-place caret.
    onUpdate: ({ editor: ed }: { editor: Editor }) => {
      onChangeRef.current?.(normalizeRichTextHtml(ed.getHTML()))
    },
    editorProps: {
      transformPastedHTML: (html: string) => normalizeRichTextHtml(html),
      // iOS often pastes text/plain only — ensure plain clipboard still inserts.
      handlePaste: (_view, event) => {
        const clipboard = event.clipboardData
        if (!clipboard) return false
        const html = clipboard.getData('text/html')?.trim()
        if (html) return false
        const text = clipboard.getData('text/plain')
        if (!text) return false
        const ed = editorRef.current
        if (!ed) return false
        event.preventDefault()
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .split(/\r?\n/)
          .map((line) => `<p>${line || '<br>'}</p>`)
          .join('')
        ed.commands.insertContent(escaped)
        return true
      },
      attributes: {
        class: cn(
          'vcard-rich-editor px-4 py-3 text-[14px] leading-relaxed text-slate-900 focus:outline-none dark:text-white',
          minHeightClassName
        ),
        // Helpful for VoiceOver / TalkBack and iOS editable discovery
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': placeholder,
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (!editor || sourceMode) return
    // Never replace document while focused — kills selection/caret/paste on iOS Safari.
    if (editor.isFocused) return
    const current = editor.getHTML()
    const next = normalizeRichTextHtml(value || '')
    if (next !== current && next !== '<p></p>') {
      // Avoid fighting the caret while typing the same content.
      if (stripEmpty(next) !== stripEmpty(current)) {
        editor.commands.setContent(next, { emitUpdate: false })
      }
    }
  }, [editor, sourceMode, value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  if (!editor) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0b0f19]',
          className
        )}
      >
        <div className={cn('animate-pulse bg-slate-50 dark:bg-white/5', minHeightClassName)} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
      style={{ ['--rte-accent' as string]: accent }}
    >
      <HoistableStyle href="vbiz-rte-accent" css={EDITOR_ACCENT_CSS} />
      <div className="rounded-t-2xl">
        <RichTextToolbar
          editor={editor}
          sourceMode={sourceMode}
          onToggleSource={() => {
            if (sourceMode) {
              editor.commands.setContent(sourceDraft || '', { emitUpdate: true })
              setSourceMode(false)
              return
            }
            setSourceDraft(editor.getHTML())
            setSourceMode(true)
          }}
        />
      </div>
      {sourceMode ? (
        <textarea
          value={sourceDraft}
          onChange={(event) => {
            setSourceDraft(event.target.value)
            onChangeRef.current?.(event.target.value)
          }}
          spellCheck={false}
          aria-label="HTML code view"
          className={cn(
            'w-full resize-y rounded-b-2xl bg-slate-950 px-4 py-3 font-mono text-[12px] leading-relaxed text-slate-100 focus:outline-none',
            minHeightClassName
          )}
        />
      ) : (
        <div className="rounded-b-2xl [&_.ProseMirror]:min-h-[inherit]">
          <SelectionBubbleMenu editor={editor} accent={accent} />
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}

function stripEmpty(html: string): string {
  return html
    .replace(/\s/g, '')
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br\/?><\/p>/g, '')
}

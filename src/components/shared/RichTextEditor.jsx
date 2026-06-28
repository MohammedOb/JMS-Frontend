'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`px-2 py-1 rounded text-[12px] font-medium transition-colors select-none ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <div className="w-px h-4 bg-gray-300 mx-1 self-center" />;

export default function RichTextEditor({ value, onChange, placeholder = 'Write your message...' }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <>
      <style>{`
        .jms-rte .ProseMirror {
          padding: 12px;
          outline: none;
          min-height: 160px;
          font-size: 13px;
          line-height: 1.65;
          color: #1f2937;
        }
        .jms-rte .ProseMirror ul  { list-style-type: disc;    padding-left: 1.4rem; margin: 0.25rem 0; }
        .jms-rte .ProseMirror ol  { list-style-type: decimal; padding-left: 1.4rem; margin: 0.25rem 0; }
        .jms-rte .ProseMirror li  { margin: 0.1rem 0; }
        .jms-rte .ProseMirror p   { margin: 0 0 0.3rem; }
        .jms-rte .ProseMirror p:last-child { margin-bottom: 0; }
        .jms-rte .ProseMirror blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; margin: 0.5rem 0; color: #6b7280; }
        .jms-rte .ProseMirror h1, .jms-rte .ProseMirror h2, .jms-rte .ProseMirror h3 { font-weight: 700; margin: 0.5rem 0 0.25rem; }
        .jms-rte .ProseMirror h1 { font-size: 1.15em; }
        .jms-rte .ProseMirror h2 { font-size: 1.05em; }
        .jms-rte .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          float: left;
          height: 0;
        }

      `}</style>

      <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
          <ToolBtn onClick={() => editor?.chain().focus().toggleBold().run()}          active={editor?.isActive('bold')}          title="Bold"><strong>B</strong></ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleItalic().run()}        active={editor?.isActive('italic')}        title="Italic"><em>I</em></ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleStrike().run()}        active={editor?.isActive('strike')}        title="Strikethrough"><s>S</s></ToolBtn>
          <Divider />
          <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading">H2</ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Sub-heading">H3</ToolBtn>
          <Divider />
          <ToolBtn onClick={() => editor?.chain().focus().toggleBulletList().run()}    active={editor?.isActive('bulletList')}    title="Bullet List">• List</ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()}   active={editor?.isActive('orderedList')}   title="Numbered List">1. List</ToolBtn>
          <Divider />
          <ToolBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()}    active={editor?.isActive('blockquote')}    title="Blockquote">" "</ToolBtn>
          <Divider />
          <ToolBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()}   active={false} title="Divider Line">—</ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()} active={false} title="Clear Formatting">✕ Clear</ToolBtn>
        </div>

        {/* Editor area */}
        <div className="jms-rte bg-white">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
}

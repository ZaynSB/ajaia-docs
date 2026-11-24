"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

/** Rich-text editor. StarterKit includes bold, italic, underline, headings and lists. */
export function DocEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content,
    immediatelyRender: false, // avoid SSR hydration mismatch
    shouldRerenderOnTransaction: true, // keep toolbar "active" states in sync
    editorProps: { attributes: { class: "doc-content min-h-[50vh] px-6 py-5 focus:outline-none", "aria-label": "Document content" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="rounded-md border border-gray-200 bg-white shadow-sm">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (label: string, title: string, active: boolean, run: () => void) => (
    <button
      key={title}
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()} // keep the selection in the editor
      onClick={run}
      className={`min-w-8 rounded px-2 py-1 text-sm ${active ? "bg-blue-100 text-blue-800" : "text-gray-700 hover:bg-gray-100"}`}
    >
      {label}
    </button>
  );
  const c = () => editor.chain().focus();
  return (
    <div role="toolbar" aria-label="Formatting" className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-gray-200 bg-white px-2 py-1.5">
      {btn("B", "Bold", editor.isActive("bold"), () => c().toggleBold().run())}
      {btn("I", "Italic", editor.isActive("italic"), () => c().toggleItalic().run())}
      {btn("U", "Underline", editor.isActive("underline"), () => c().toggleUnderline().run())}
      <span className="mx-1 w-px bg-gray-200" />
      {btn("H1", "Heading 1", editor.isActive("heading", { level: 1 }), () => c().toggleHeading({ level: 1 }).run())}
      {btn("H2", "Heading 2", editor.isActive("heading", { level: 2 }), () => c().toggleHeading({ level: 2 }).run())}
      {btn("H3", "Heading 3", editor.isActive("heading", { level: 3 }), () => c().toggleHeading({ level: 3 }).run())}
      {btn("¶", "Normal text", editor.isActive("paragraph"), () => c().setParagraph().run())}
      <span className="mx-1 w-px bg-gray-200" />
      {btn("• List", "Bulleted list", editor.isActive("bulletList"), () => c().toggleBulletList().run())}
      {btn("1. List", "Numbered list", editor.isActive("orderedList"), () => c().toggleOrderedList().run())}
      <span className="mx-1 w-px bg-gray-200" />
      {btn("↶", "Undo", false, () => c().undo().run())}
      {btn("↷", "Redo", false, () => c().redo().run())}
    </div>
  );
}

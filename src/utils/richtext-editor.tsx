import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import CodeBlock from "@tiptap/extension-code-block";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (content: string) => void }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Bold,
            Italic,
            Underline,
            CodeBlock,
            Table.configure({ resizable: true }), // Enable resizing
            TableRow,
            TableCell,
            TableHeader,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML()); // Store content as HTML
        },
    });

    return (
        <div>
            <EditorContent editor={editor} />
        </div>
    );
};

export default RichTextEditor;

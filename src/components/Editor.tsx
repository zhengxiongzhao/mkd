import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import { useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { HeadingItem } from "./OutlinePanel";
import "./Editor.css";

export interface EditorRef {
  getMarkdown: () => string;
  getHeadings: () => HeadingItem[];
  scrollToPos: (pos: number) => void;
}

interface EditorProps {
  markdownContent: string;
  onUpdate?: (markdown: string) => void;
  onHeadingsChange?: (headings: HeadingItem[]) => void;
}

export const Editor = forwardRef<EditorRef, EditorProps>(
  ({ markdownContent, onUpdate, onHeadingsChange }, ref) => {
    const extractHeadings = useCallback((editor: ReturnType<typeof useEditor>): HeadingItem[] => {
      if (!editor) return [];
      const headings: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          headings.push({
            level: node.attrs.level as number,
            text: node.textContent,
            pos,
          });
        }
      });
      return headings;
    }, []);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4, 5, 6] },
          codeBlock: {
            HTMLAttributes: { class: "code-block" },
          },
        }),
        Markdown.configure({
          markedOptions: {
            gfm: true,
            breaks: false,
          },
        }),
        Image.configure({
          inline: false,
          allowBase64: true,
        }),
        Table.configure({
          resizable: false,
        }),
        TableRow,
        TableCell,
        TableHeader,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Link.configure({
          openOnClick: false,
        }),
      ],
      content: markdownContent,
      contentType: "markdown",
      onUpdate: ({ editor }) => {
        if (onUpdate) {
          onUpdate(editor.getMarkdown());
        }
        if (onHeadingsChange) {
          onHeadingsChange(extractHeadings(editor));
        }
      },
      editorProps: {
        attributes: {
          class: "tiptap-editor",
        },
      },
    });

    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        if (!editor) return "";
        return editor.getMarkdown();
      },
      getHeadings: () => extractHeadings(editor),
      scrollToPos: (pos: number) => {
        if (!editor) return;
        editor.commands.focus();
        editor.commands.setTextSelection(pos);
        // 滚动到对应位置
        const domAtPos = editor.view.domAtPos(pos);
        const node = domAtPos.node as HTMLElement;
        if (node && node.scrollIntoView) {
          node.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (node.parentElement) {
          node.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      },
    }));

    useEffect(() => {
      if (editor && markdownContent !== undefined) {
        const currentMd = editor.getMarkdown();
        if (currentMd !== markdownContent) {
          editor.commands.setContent(markdownContent, {
            contentType: "markdown",
          });
          // 内容更新后同步标题
          if (onHeadingsChange) {
            onHeadingsChange(extractHeadings(editor));
          }
        }
      }
    }, [markdownContent, editor]);

    return (
      <div className="editor-wrapper">
        <EditorContent editor={editor} />
      </div>
    );
  }
);

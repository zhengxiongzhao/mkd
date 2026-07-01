import { Editor } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import "./TableMenu.css";

interface TableMenuProps {
  editor: Editor | null;
}

export function TableMenu({ editor }: TableMenuProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!editor) return;

    // 检测光标是否在表格内
    const { selection } = editor.state;
    const $pos = selection.$anchor;
    let inTable = false;
    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type.name === "table") {
        inTable = true;
        break;
      }
    }

    if (!inTable) {
      setVisible(false);
      return;
    }

    // 定位到上一行的上方，水平居中于编辑器
    const domAtPos = editor.view.domAtPos(selection.from);
    let node: HTMLElement | null = (domAtPos.node.nodeType === 3
      ? domAtPos.node.parentElement
      : domAtPos.node) as HTMLElement;
    const currentTr = node?.closest("tr") as HTMLElement | null;
    if (currentTr) {
      const prevTr = currentTr.previousElementSibling as HTMLElement | null;
      const targetRow = prevTr || currentTr;
      const rowRect = targetRow.getBoundingClientRect();
      const editorWrapper = editor.view.dom.closest(".editor-wrapper") as HTMLElement | null;
      const wrapperRect = editorWrapper?.getBoundingClientRect();
      setPosition({
        top: rowRect.top - 36,
        left: wrapperRect
          ? wrapperRect.left + wrapperRect.width / 2
          : rowRect.left + rowRect.width / 2,
      });
    }
    setVisible(true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", updatePosition);
    editor.on("focus", updatePosition);

    // 滚动时重新计算位置
    const wrapper = editor.view.dom.closest(".editor-wrapper");
    const onScroll = () => updatePosition();
    wrapper?.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("focus", updatePosition);
      wrapper?.removeEventListener("scroll", onScroll);
    };
  }, [editor, updatePosition]);

  if (!visible || !editor) return null;

  return (
    <div
      className="table-menu"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        title="在左侧插入列"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h7v18H3z" opacity="0.3" />
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="10" y1="3" x2="10" y2="21" />
          <line x1="14" y1="3" x2="14" y2="21" />
        </svg>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="在右侧插入列"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3h7v18h-7z" opacity="0.3" />
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="10" y1="3" x2="10" y2="21" />
          <line x1="14" y1="3" x2="14" y2="21" />
        </svg>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className="table-menu-divider" />

      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        title="在上方插入行"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h18v7H3z" opacity="0.3" />
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="3" y1="14" x2="21" y2="14" />
        </svg>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="在下方插入行"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 14h18v7H3z" opacity="0.3" />
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="3" y1="14" x2="21" y2="14" />
        </svg>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className="table-menu-divider" />

      <button
        className="table-menu-btn danger"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="删除列"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="10" y1="3" x2="10" y2="21" />
          <line x1="14" y1="3" x2="14" y2="21" />
          <line x1="5" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="5" y2="15" />
        </svg>
      </button>
      <button
        className="table-menu-btn danger"
        onClick={() => editor.chain().focus().deleteRow().run()}
        title="删除行"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="3" y1="14" x2="21" y2="14" />
          <line x1="8" y1="6" x2="12" y2="8" /><line x1="12" y1="6" x2="8" y2="8" />
        </svg>
      </button>
      <button
        className="table-menu-btn danger"
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="删除表格"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}

import { useState, useCallback } from "react";
import "./OutlinePanel.css";

export interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

interface OutlineNode {
  heading: HeadingItem;
  index: number;
  children: OutlineNode[];
}

interface OutlinePanelProps {
  headings: HeadingItem[];
  onHeadingClick: (pos: number) => void;
  activeIndex?: number;
}

// 将扁平标题列表转换为树结构
function buildTree(headings: HeadingItem[]): OutlineNode[] {
  const root: OutlineNode[] = [];
  const stack: OutlineNode[] = [];

  headings.forEach((heading, index) => {
    const node: OutlineNode = { heading, index, children: [] };

    // 找到合适的父节点
    while (stack.length > 0 && stack[stack.length - 1].heading.level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return root;
}

export function OutlinePanel({ headings, onHeadingClick, activeIndex }: OutlinePanelProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(false);

  const toggleNode = useCallback((index: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allCollapsed) {
      // 展开全部
      setCollapsed(new Set());
      setAllCollapsed(false);
    } else {
      // 折叠所有有子节点的
      const tree = buildTree(headings);
      const toCollapse = new Set<number>();
      const collectParents = (nodes: OutlineNode[]) => {
        for (const node of nodes) {
          if (node.children.length > 0) {
            toCollapse.add(node.index);
            collectParents(node.children);
          }
        }
      };
      collectParents(tree);
      setCollapsed(toCollapse);
      setAllCollapsed(true);
    }
  }, [allCollapsed, headings]);

  if (headings.length === 0) {
    return (
      <div className="outline-panel">
        <div className="outline-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="10" x2="3" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="21" y1="18" x2="3" y2="18" />
          </svg>
          <span>大纲</span>
        </div>
        <div className="outline-empty">暂无标题</div>
      </div>
    );
  }

  const tree = buildTree(headings);
  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <div className="outline-panel">
      <div className="outline-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="10" x2="3" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="21" y1="18" x2="3" y2="18" />
        </svg>
        <span>大纲</span>
        <button
          className="outline-collapse-all"
          onClick={toggleAll}
          title={allCollapsed ? "展开全部" : "折叠全部"}
        >
          {allCollapsed ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
          )}
        </button>
      </div>
      <div className="outline-list">
        {renderNodes(tree, minLevel, collapsed, toggleNode, onHeadingClick, activeIndex)}
      </div>
    </div>
  );
}

function renderNodes(
  nodes: OutlineNode[],
  minLevel: number,
  collapsed: Set<number>,
  toggleNode: (index: number) => void,
  onHeadingClick: (pos: number) => void,
  activeIndex?: number,
): React.ReactNode {
  return nodes.map((node) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.index);
    const indent = (node.heading.level - minLevel) * 14;

    return (
      <div key={`${node.heading.pos}-${node.index}`} className="outline-node">
        <div
          className={`outline-item ${node.index === activeIndex ? "active" : ""}`}
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {hasChildren ? (
            <button
              className={`outline-fold-btn ${isCollapsed ? "collapsed" : ""}`}
              onClick={() => toggleNode(node.index)}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
            <span className="outline-fold-placeholder" />
          )}
          <button
            className="outline-item-content"
            onClick={() => onHeadingClick(node.heading.pos)}
            title={node.heading.text}
          >
            <span className="outline-item-indicator">H{node.heading.level}</span>
            <span className="outline-item-text">{node.heading.text}</span>
          </button>
        </div>
        {hasChildren && !isCollapsed && (
          <div className="outline-children">
            {renderNodes(node.children, minLevel, collapsed, toggleNode, onHeadingClick, activeIndex)}
          </div>
        )}
      </div>
    );
  });
}

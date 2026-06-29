import { useState, useEffect, useCallback } from "react";
import { readDir } from "@tauri-apps/plugin-fs";
import "./FileTree.css";

interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileEntry[];
}

interface FileTreeProps {
  rootPath: string | null;
  onFileSelect: (path: string) => void;
  currentFile: string | null;
}

export function FileTree({ rootPath, onFileSelect, currentFile }: FileTreeProps) {
  const [tree, setTree] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDirectory = useCallback(async (dirPath: string): Promise<FileEntry[]> => {
    try {
      const entries = await readDir(dirPath);
      const result: FileEntry[] = [];

      for (const entry of entries) {
        if (!entry.name || entry.name.startsWith(".")) continue;
        const fullPath = dirPath.endsWith("/")
          ? `${dirPath}${entry.name}`
          : `${dirPath}/${entry.name}`;
        result.push({
          name: entry.name,
          path: fullPath,
          isDir: entry.isDirectory,
        });
      }

      // 排序：文件夹在前，按名称字母序
      result.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });

      return result;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!rootPath) {
      setTree([]);
      return;
    }
    setLoading(true);
    loadDirectory(rootPath).then((entries) => {
      setTree(entries);
      setLoading(false);
    });
  }, [rootPath, loadDirectory]);

  if (!rootPath) {
    return (
      <div className="file-tree-empty">
        <p>未打开文件夹</p>
        <p className="file-tree-hint">打开文件后将自动显示所在目录</p>
      </div>
    );
  }

  if (loading) {
    return <div className="file-tree-loading">加载中...</div>;
  }

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <span className="file-tree-root-name" title={rootPath}>
          {rootPath.split("/").pop() || rootPath}
        </span>
      </div>
      <div className="file-tree-list">
        {tree.map((entry) => (
          <TreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            onFileSelect={onFileSelect}
            currentFile={currentFile}
            loadDirectory={loadDirectory}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNodeProps {
  entry: FileEntry;
  depth: number;
  onFileSelect: (path: string) => void;
  currentFile: string | null;
  loadDirectory: (path: string) => Promise<FileEntry[]>;
}

function TreeNode({ entry, depth, onFileSelect, currentFile, loadDirectory }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[] | null>(null);

  const handleClick = async () => {
    if (entry.isDir) {
      if (!expanded && children === null) {
        const loaded = await loadDirectory(entry.path);
        setChildren(loaded);
      }
      setExpanded(!expanded);
    } else {
      // 只打开 markdown 相关文件
      const ext = entry.name.split(".").pop()?.toLowerCase();
      if (ext === "md" || ext === "markdown" || ext === "txt") {
        onFileSelect(entry.path);
      }
    }
  };

  const isActive = currentFile === entry.path;
  const isMarkdown = !entry.isDir && /\.(md|markdown|txt)$/i.test(entry.name);

  return (
    <>
      <div
        className={`tree-node ${isActive ? "active" : ""} ${!entry.isDir && !isMarkdown ? "dimmed" : ""}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
        title={entry.path}
      >
        <span className="tree-node-icon">
          {entry.isDir
            ? (expanded ? <FolderOpenIcon /> : <FolderIcon />)
            : <FileIcon name={entry.name} />
          }
        </span>
        <span className="tree-node-name">{entry.name}</span>
      </div>
      {entry.isDir && expanded && children && (
        <div className="tree-node-children">
          {children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              currentFile={currentFile}
              loadDirectory={loadDirectory}
            />
          ))}
          {children.length === 0 && (
            <div className="tree-node-empty" style={{ paddingLeft: `${12 + (depth + 1) * 16}px` }}>
              (空)
            </div>
          )}
        </div>
      )}
    </>
  );
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
    </svg>
  );
}

function FolderOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 14l1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2A2 2 0 0 0 12.07 6H18a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase();

  // Markdown
  if (ext === "md" || ext === "markdown") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="icon-markdown">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="9" y1="11" x2="13" y2="11" />
      </svg>
    );
  }

  // Image
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext || "")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="icon-image">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }

  // Code (JS/TS/JSX/TSX)
  if (["js", "jsx", "ts", "tsx"].includes(ext || "")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="icon-code">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  }

  // JSON / Config
  if (["json", "yaml", "yml", "toml"].includes(ext || "")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="icon-config">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  }

  // CSS
  if (["css", "scss", "less"].includes(ext || "")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="icon-style">
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      </svg>
    );
  }

  // Text
  if (ext === "txt") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="icon-text">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );
  }

  // Default file
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="icon-file">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

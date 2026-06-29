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
          {entry.isDir ? (expanded ? "📂" : "📁") : getFileIcon(entry.name)}
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

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "md":
    case "markdown":
      return "📝";
    case "txt":
      return "📄";
    case "json":
      return "⚙️";
    case "css":
      return "🎨";
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return "📜";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return "🖼️";
    default:
      return "📄";
  }
}

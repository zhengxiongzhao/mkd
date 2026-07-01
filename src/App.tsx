import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Editor, EditorRef } from "./components/Editor";
import { Toolbar } from "./components/Toolbar";
import { FileTree } from "./components/FileTree";
import { OutlinePanel, HeadingItem } from "./components/OutlinePanel";
import { readTextFile, writeTextFile, stat } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { convertFileSrc } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

function useResizable(initialWidth: number, minWidth: number, maxWidth: number) {
  const [width, setWidth] = useState(initialWidth);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent, direction: "left" | "right") => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    const dir = direction;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = dir === "right"
        ? ev.clientX - startX.current
        : startX.current - ev.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width, minWidth, maxWidth]);

  return { width, onMouseDown };
}

function App() {
  const [markdownSource, setMarkdownSource] = useState("");
  const [sourceMode, setSourceMode] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [outlineVisible, setOutlineVisible] = useState(true);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [rootDir, setRootDir] = useState<string | null>(null);
  const editorRef = useRef<EditorRef>(null);
  const isLoadingRef = useRef(false);
  const savedContentRef = useRef("");

  const sidebar = useResizable(240, 140, 450);
  const outline = useResizable(260, 140, 450);

  // 将 markdown 中的本地图片路径转换为 asset 协议 URL
  const convertImagePaths = useCallback((md: string, dir: string): string => {
    return md.replace(
      /(!\[[^\]]*\]\()([^)]+)(\))/g,
      (_match, prefix, src, suffix) => {
        // 跳过已经是 URL 的路径（http/https/data/asset）
        if (/^(https?|data|asset|blob):/i.test(src)) return _match;
        // 解析相对路径为绝对路径
        let absolutePath = src;
        if (!src.startsWith("/")) {
          absolutePath = `${dir}/${src}`;
        }
        return `${prefix}${convertFileSrc(absolutePath)}${suffix}`;
      }
    );
  }, []);

  // 将 asset URL 还原为原始路径（保存时）
  const restoreImagePaths = useCallback((md: string, dir: string): string => {
    return md.replace(
      /(!\[[^\]]*\]\()(https?:\/\/asset\.localhost\/[^)]+)(\))/g,
      (_match, prefix, assetUrl, suffix) => {
        try {
          // asset URL 格式: http://asset.localhost/path
          const url = new URL(assetUrl);
          let absolutePath = decodeURIComponent(url.pathname);
          // 尝试转换为相对路径
          if (absolutePath.startsWith(dir + "/")) {
            const relativePath = absolutePath.slice(dir.length + 1);
            return `${prefix}${relativePath}${suffix}`;
          }
          return `${prefix}${absolutePath}${suffix}`;
        } catch {
          return _match;
        }
      }
    );
  }, []);

  // 动态更新窗口标题为当前文件名（未保存时显示 *）
  useEffect(() => {
    let title = filePath
      ? filePath.split("/").pop() || filePath.split("\\").pop() || "MKD Editor"
      : "MKD Editor";
    if (dirty) title += " *";
    getCurrentWindow().setTitle(title);
  }, [filePath, dirty]);

  const openFileByPath = useCallback(async (path: string) => {
    const text = await readTextFile(path);
    const dir = path.substring(0, path.lastIndexOf("/"));
    setFilePath(path);
    setDirty(false);
    isLoadingRef.current = true;
    // 将本地图片路径转为 asset URL 以便 webview 显示
    const converted = convertImagePaths(text, dir);
    savedContentRef.current = converted;
    setMarkdownSource(converted);
  }, [convertImagePaths]);

  const handleOpenFile = useCallback(async () => {
    const selected = await invoke<string | null>("open_file_or_folder");
    if (!selected) return;
    // 判断是文件还是文件夹
    try {
      const info = await stat(selected);
      if (info.isDirectory) {
        setRootDir(selected);
      } else {
        await openFileByPath(selected);
        const dir = selected.substring(0, selected.lastIndexOf("/"));
        setRootDir(dir);
      }
    } catch {
      // fallback: 尝试作为文件打开
      await openFileByPath(selected);
      const dir = selected.substring(0, selected.lastIndexOf("/"));
      setRootDir(dir);
    }
  }, [openFileByPath]);

  const handleSaveFile = useCallback(async () => {
    let savePath = filePath;
    if (!savePath) {
      const selected = await save({
        filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
      });
      if (!selected) return;
      savePath = selected;
      setFilePath(savePath);
    }
    let md: string;
    if (sourceMode) {
      md = markdownSource;
    } else {
      md = editorRef.current?.getMarkdown() ?? markdownSource;
    }
    // 保存前将 asset URL 还原为原始路径
    const dir = savePath.substring(0, savePath.lastIndexOf("/"));
    md = restoreImagePaths(md, dir);
    await writeTextFile(savePath, md);
    savedContentRef.current = markdownSource;
    setDirty(false);
  }, [filePath, sourceMode, markdownSource, restoreImagePaths]);

  const handleEditorUpdate = useCallback((markdown: string) => {
    setMarkdownSource(markdown);
    if (isLoadingRef.current) {
      isLoadingRef.current = false;
    } else {
      setDirty(markdown !== savedContentRef.current);
    }
  }, []);

  const handleSourceChange = useCallback((value: string) => {
    setMarkdownSource(value);
    setDirty(value !== savedContentRef.current);
  }, []);

  const handleToggleMode = useCallback(() => {
    if (!sourceMode) {
      const md = editorRef.current?.getMarkdown();
      if (md !== undefined) {
        setMarkdownSource(md);
      }
    }
    setSourceMode(!sourceMode);
  }, [sourceMode]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarVisible((v) => !v);
  }, []);

  const handleToggleOutline = useCallback(() => {
    setOutlineVisible((v) => !v);
  }, []);

  const handleHeadingsChange = useCallback((newHeadings: HeadingItem[]) => {
    setHeadings(newHeadings);
  }, []);

  const handleHeadingClick = useCallback((pos: number) => {
    editorRef.current?.scrollToPos(pos);
  }, []);

  // 监听原生菜单事件（Cmd+O / Cmd+S 通过系统菜单触发）
  useEffect(() => {
    const unlisten = listen<string>("menu-event", (event) => {
      if (event.payload === "open") {
        handleOpenFile();
      } else if (event.payload === "save") {
        handleSaveFile();
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, [handleOpenFile, handleSaveFile]);

  // 源码模式下通过正则提取标题
  const sourceHeadings = useMemo((): HeadingItem[] => {
    if (!sourceMode) return [];
    const result: HeadingItem[] = [];
    const lines = markdownSource.split("\n");
    let pos = 0;
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)/);
      if (match) {
        result.push({
          level: match[1].length,
          text: match[2].replace(/\s+$/, ""),
          pos,
        });
      }
      pos += line.length + 1;
    }
    return result;
  }, [sourceMode, markdownSource]);

  const handleFileSelect = useCallback(async (path: string) => {
    await openFileByPath(path);
  }, [openFileByPath]);

  return (
    <div className="app">
      <Toolbar
        onOpen={handleOpenFile}
        onSave={handleSaveFile}
        sourceMode={sourceMode}
        onToggleMode={handleToggleMode}
        sidebarVisible={sidebarVisible}
        onToggleSidebar={handleToggleSidebar}
        outlineVisible={outlineVisible}
        onToggleOutline={handleToggleOutline}
      />
      <div className="main-content">
        {sidebarVisible && (
          <>
            <div className="sidebar" style={{ width: sidebar.width, minWidth: sidebar.width }}>
              <FileTree
                rootPath={rootDir}
                onFileSelect={handleFileSelect}
                currentFile={filePath}
              />
            </div>
            <div
              className="resize-handle"
              onMouseDown={(e) => sidebar.onMouseDown(e, "right")}
            />
          </>
        )}
        <div className="editor-container">
          {sourceMode ? (
            <textarea
              className="source-editor"
              value={markdownSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              spellCheck={false}
              placeholder="在此输入 Markdown 源码..."
            />
          ) : (
            <Editor
              ref={editorRef}
              markdownContent={markdownSource}
              onUpdate={handleEditorUpdate}
              onHeadingsChange={handleHeadingsChange}
            />
          )}
        </div>
        {outlineVisible && (
          <>
            <div
              className="resize-handle"
              onMouseDown={(e) => outline.onMouseDown(e, "left")}
            />
            <div className="outline-sidebar" style={{ width: outline.width, minWidth: outline.width }}>
              <OutlinePanel
                headings={sourceMode ? sourceHeadings : headings}
                onHeadingClick={handleHeadingClick}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

import { useState, useCallback, useRef, useEffect } from "react";
import { Editor, EditorRef } from "./components/Editor";
import { Toolbar } from "./components/Toolbar";
import { FileTree } from "./components/FileTree";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

function App() {
  const [markdownSource, setMarkdownSource] = useState("");
  const [sourceMode, setSourceMode] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [rootDir, setRootDir] = useState<string | null>(null);
  const editorRef = useRef<EditorRef>(null);

  // 动态更新窗口标题为当前文件名
  useEffect(() => {
    const title = filePath
      ? filePath.split("/").pop() || filePath.split("\\").pop() || "MKD Editor"
      : "MKD Editor";
    getCurrentWindow().setTitle(title);
  }, [filePath]);

  const openFileByPath = useCallback(async (path: string) => {
    const text = await readTextFile(path);
    setFilePath(path);
    setMarkdownSource(text);
  }, []);

  const handleOpenFile = useCallback(async () => {
    const selected = await open({
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });
    if (selected) {
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
    await writeTextFile(savePath, md);
  }, [filePath, sourceMode, markdownSource]);

  const handleEditorUpdate = useCallback((markdown: string) => {
    setMarkdownSource(markdown);
  }, []);

  const handleSourceChange = useCallback((value: string) => {
    setMarkdownSource(value);
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
      />
      <div className="main-content">
        {sidebarVisible && (
          <div className="sidebar">
            <FileTree
              rootPath={rootDir}
              onFileSelect={handleFileSelect}
              currentFile={filePath}
            />
          </div>
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
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

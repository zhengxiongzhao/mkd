import { useState, useCallback, useRef } from "react";
import { Editor, EditorRef } from "./components/Editor";
import { Toolbar } from "./components/Toolbar";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import "./App.css";

function App() {
  const [markdownSource, setMarkdownSource] = useState("");
  const [sourceMode, setSourceMode] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const editorRef = useRef<EditorRef>(null);

  const handleOpenFile = useCallback(async () => {
    const selected = await open({
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });
    if (selected) {
      const text = await readTextFile(selected);
      setFilePath(selected);
      setMarkdownSource(text);
    }
  }, []);

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

  return (
    <div className="app">
      <Toolbar
        onOpen={handleOpenFile}
        onSave={handleSaveFile}
        sourceMode={sourceMode}
        onToggleMode={handleToggleMode}
        filePath={filePath}
      />
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
  );
}

export default App;

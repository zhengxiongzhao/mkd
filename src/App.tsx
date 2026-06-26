import { useState, useCallback } from "react";
import { Editor } from "./components/Editor";
import { Toolbar } from "./components/Toolbar";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import TurndownService from "turndown";
import { marked } from "marked";
import "./App.css";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

function App() {
  const [content, setContent] = useState<string>("");
  const [sourceMode, setSourceMode] = useState(false);
  const [markdownSource, setMarkdownSource] = useState("");
  const [filePath, setFilePath] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");

  const handleOpenFile = useCallback(async () => {
    const selected = await open({
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });
    if (selected) {
      const text = await readTextFile(selected);
      setFilePath(selected);
      setMarkdownSource(text);
      const html = await marked(text);
      setHtmlContent(html);
      setContent(html);
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
    const md = sourceMode ? markdownSource : content;
    await writeTextFile(savePath, md);
  }, [filePath, sourceMode, markdownSource, content]);

  const handleEditorUpdate = useCallback((html: string) => {
    const md = turndown.turndown(html);
    setContent(md);
    setMarkdownSource(md);
  }, []);

  const handleSourceChange = useCallback(
    (value: string) => {
      setMarkdownSource(value);
      setContent(value);
    },
    []
  );

  const handleToggleMode = useCallback(async () => {
    if (sourceMode) {
      // Switching from source to editor: convert markdown to HTML
      const html = await marked(markdownSource);
      setHtmlContent(html);
    }
    setSourceMode(!sourceMode);
  }, [sourceMode, markdownSource]);

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
          <Editor content={htmlContent} onUpdate={handleEditorUpdate} />
        )}
      </div>
    </div>
  );
}

export default App;

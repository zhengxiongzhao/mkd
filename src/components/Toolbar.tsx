import { ThemePicker } from "./ThemePicker";

interface ToolbarProps {
  onOpen: () => void;
  onSave: () => void;
  sourceMode: boolean;
  onToggleMode: () => void;
  filePath: string | null;
}

export function Toolbar({
  onOpen,
  onSave,
  sourceMode,
  onToggleMode,
  filePath,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn" onClick={onOpen} title="打开文件">
          📂 打开
        </button>
        <button className="toolbar-btn" onClick={onSave} title="保存文件">
          💾 保存
        </button>
        <div className="toolbar-separator" />
        <button
          className={`toolbar-btn mode-btn ${sourceMode ? "active" : ""}`}
          onClick={onToggleMode}
          title={sourceMode ? "切换到编辑模式" : "切换到源码模式"}
        >
          {sourceMode ? "📝 编辑模式" : "📄 源码模式"}
        </button>
        <div className="toolbar-separator" />
        <ThemePicker />
      </div>
      <div className="toolbar-right">
        {filePath && (
          <span className="file-path" title={filePath}>
            {filePath.split("/").pop() || filePath.split("\\").pop()}
          </span>
        )}
      </div>
    </div>
  );
}

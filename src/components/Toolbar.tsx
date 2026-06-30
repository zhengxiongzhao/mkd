import { ThemePicker } from "./ThemePicker";

interface ToolbarProps {
  onOpen: () => void;
  onSave: () => void;
  sourceMode: boolean;
  onToggleMode: () => void;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  outlineVisible: boolean;
  onToggleOutline: () => void;
}

export function Toolbar({
  onOpen,
  onSave,
  sourceMode,
  onToggleMode,
  sidebarVisible,
  onToggleSidebar,
  outlineVisible,
  onToggleOutline,
}: ToolbarProps) {
  return (
    <div className="toolbar" data-tauri-drag-region>
      <div className="toolbar-titlebar">
        <button
          className={`titlebar-btn sidebar-toggle-btn ${sidebarVisible ? "active" : ""}`}
          onClick={onToggleSidebar}
          title={sidebarVisible ? "隐藏文件树" : "显示文件树"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>
      <div className="toolbar-center" data-tauri-drag-region>
      </div>
      <div className="toolbar-actions">
        <button className="toolbar-btn" onClick={onOpen} title="打开">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" /></svg>
          <span>打开</span>
        </button>
        <button className="toolbar-btn" onClick={onSave} title="保存文件">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
          <span>保存</span>
        </button>
        <div className="toolbar-separator" />
        <button
          className={`toolbar-btn mode-btn ${sourceMode ? "active" : ""}`}
          onClick={onToggleMode}
          title={sourceMode ? "切换到编辑模式" : "切换到源码模式"}
        >
          {sourceMode ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg><span>编辑</span></>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg><span>源码</span></>
          )}
        </button>
        <div className="toolbar-separator" />
        <ThemePicker />
      </div>
      <div className="toolbar-titlebar-right">
        <button
          className={`titlebar-btn outline-toggle-btn ${outlineVisible ? "active" : ""}`}
          onClick={onToggleOutline}
          title={outlineVisible ? "隐藏大纲" : "显示大纲"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="10" x2="7" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="7" y2="14" />
            <line x1="21" y1="18" x2="3" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

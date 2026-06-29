import { useState, useEffect, useRef } from "react";
import {
  ThemeInfo,
  getAllThemes,
  loadTheme,
  saveThemePreference,
  loadThemePreference,
  openThemesFolder,
  createExampleTheme,
} from "../themeManager";

interface ThemePickerProps {
  onThemeChange?: (themeId: string) => void;
}

export function ThemePicker({ onThemeChange }: ThemePickerProps) {
  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [currentTheme, setCurrentTheme] = useState("default");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const savedTheme = await loadThemePreference();
      setCurrentTheme(savedTheme);
      await loadTheme(savedTheme);
      const allThemes = await getAllThemes();
      setThemes(allThemes);
    }
    init();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTheme = async (themeId: string) => {
    setCurrentTheme(themeId);
    await loadTheme(themeId);
    await saveThemePreference(themeId);
    setIsOpen(false);
    onThemeChange?.(themeId);
  };

  const handleRefreshThemes = async () => {
    const allThemes = await getAllThemes();
    setThemes(allThemes);
  };

  const handleOpenFolder = async () => {
    await createExampleTheme();
    const dir = await openThemesFolder();
    const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
    await revealItemInDir(dir);
    setIsOpen(false);
  };

  const currentThemeName =
    themes.find((t) => t.id === currentTheme)?.name || "默认";

  return (
    <div className="theme-picker" ref={dropdownRef}>
      <button
        className="toolbar-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="选择主题"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" /><circle cx="8.5" cy="7.5" r="2.5" /><circle cx="6.5" cy="12.5" r="2.5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.39-.15-.74-.39-1.01-.24-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z" /></svg>
        <span>{currentThemeName}</span>
      </button>
      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-dropdown-header">主题</div>
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-option ${theme.id === currentTheme ? "active" : ""}`}
              onClick={() => handleSelectTheme(theme.id)}
            >
              <span className="theme-option-name">{theme.name}</span>
              {!theme.builtin && <span className="theme-badge">自定义</span>}
              {theme.id === currentTheme && <span className="theme-check">✓</span>}
            </button>
          ))}
          <div className="theme-dropdown-divider" />
          <button className="theme-option" onClick={handleRefreshThemes}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
            <span>刷新主题列表</span>
          </button>
          <button className="theme-option" onClick={handleOpenFolder}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" /></svg>
            <span>打开主题文件夹</span>
          </button>
        </div>
      )}
    </div>
  );
}

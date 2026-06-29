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
        🎨 {currentThemeName}
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
            🔄 刷新主题列表
          </button>
          <button className="theme-option" onClick={handleOpenFolder}>
            📁 打开主题文件夹
          </button>
        </div>
      )}
    </div>
  );
}

import { readTextFile, exists, mkdir, writeTextFile, readDir } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

import defaultTheme from "./themes/default.css?raw";
import githubTheme from "./themes/github.css?raw";
import darkTheme from "./themes/dark.css?raw";

export interface ThemeInfo {
  id: string;
  name: string;
  builtin: boolean;
}

const BUILTIN_THEMES: Record<string, { name: string; css: string }> = {
  default: { name: "默认", css: defaultTheme },
  github: { name: "GitHub", css: githubTheme },
  dark: { name: "暗黑", css: darkTheme },
};

const STYLE_ELEMENT_ID = "mkd-editor-theme";
const THEME_DIR_NAME = "themes";
const CONFIG_FILE = "theme-config.json";

let themesDir: string | null = null;

async function getThemesDir(): Promise<string> {
  if (themesDir) return themesDir;
  const appData = await appDataDir();
  themesDir = await join(appData, THEME_DIR_NAME);
  return themesDir;
}

async function ensureThemesDir(): Promise<void> {
  const dir = await getThemesDir();
  const dirExists = await exists(dir);
  if (!dirExists) {
    await mkdir(dir, { recursive: true });
  }
}

function applyCSS(css: string): void {
  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

export function getBuiltinThemes(): ThemeInfo[] {
  return Object.entries(BUILTIN_THEMES).map(([id, { name }]) => ({
    id,
    name,
    builtin: true,
  }));
}

export async function getUserThemes(): Promise<ThemeInfo[]> {
  try {
    await ensureThemesDir();
    const dir = await getThemesDir();
    const entries = await readDir(dir);
    return entries
      .filter((e) => e.name?.endsWith(".css"))
      .map((e) => ({
        id: `user:${e.name}`,
        name: e.name!.replace(/\.css$/, ""),
        builtin: false,
      }));
  } catch {
    return [];
  }
}

export async function getAllThemes(): Promise<ThemeInfo[]> {
  const builtin = getBuiltinThemes();
  const user = await getUserThemes();
  return [...builtin, ...user];
}

export async function loadTheme(themeId: string): Promise<void> {
  if (themeId in BUILTIN_THEMES) {
    applyCSS(BUILTIN_THEMES[themeId].css);
    // 暗黑主题需要同步编辑器容器背景
    const wrapper = document.querySelector(".editor-wrapper") as HTMLElement;
    if (wrapper) {
      wrapper.style.background = themeId === "dark" ? "#0d1117" : "";
    }
  } else if (themeId.startsWith("user:")) {
    const fileName = themeId.replace("user:", "");
    const dir = await getThemesDir();
    const filePath = await join(dir, fileName);
    const css = await readTextFile(filePath);
    applyCSS(css);
  }
}

export async function saveThemePreference(themeId: string): Promise<void> {
  try {
    await ensureThemesDir();
    const appData = await appDataDir();
    const configPath = await join(appData, CONFIG_FILE);
    await writeTextFile(configPath, JSON.stringify({ theme: themeId }));
  } catch (e) {
    console.error("Failed to save theme preference:", e);
  }
}

export async function loadThemePreference(): Promise<string> {
  try {
    const appData = await appDataDir();
    const configPath = await join(appData, CONFIG_FILE);
    const configExists = await exists(configPath);
    if (configExists) {
      const content = await readTextFile(configPath);
      const config = JSON.parse(content);
      return config.theme || "default";
    }
  } catch {
    // ignore
  }
  return "default";
}

export async function openThemesFolder(): Promise<string> {
  await ensureThemesDir();
  return await getThemesDir();
}

export async function createExampleTheme(): Promise<void> {
  await ensureThemesDir();
  const dir = await getThemesDir();
  const examplePath = await join(dir, "my-custom.css");
  const exampleExists = await exists(examplePath);
  if (!exampleExists) {
    const exampleCSS = `/* 自定义主题示例 - 修改此文件后在应用中选择该主题即可生效 */
/* 所有样式都需要以 .tiptap-editor 为前缀 */

.tiptap-editor {
  font-family: "Georgia", serif;
  font-size: 17px;
  line-height: 1.8;
  color: #333;
}

.tiptap-editor h1 {
  font-size: 2.2em;
  font-weight: 700;
  color: #2c3e50;
  margin: 1em 0 0.5em;
}

.tiptap-editor h2 {
  font-size: 1.6em;
  font-weight: 600;
  color: #34495e;
  margin: 0.8em 0 0.4em;
}

.tiptap-editor blockquote {
  border-left: 4px solid #3498db;
  background: #ecf0f1;
  padding: 0.5em 1em;
  margin: 0.8em 0;
  border-radius: 0 4px 4px 0;
}

.tiptap-editor code {
  background: #ecf0f1;
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-family: "Fira Code", monospace;
}

.tiptap-editor pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 1em;
  border-radius: 8px;
}

.tiptap-editor a {
  color: #3498db;
}

.tiptap-editor table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8em 0;
}

.tiptap-editor th,
.tiptap-editor td {
  border: 1px solid #bdc3c7;
  padding: 0.5em 0.75em;
}

.tiptap-editor th {
  background: #ecf0f1;
  font-weight: 600;
}

.tiptap-editor img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tiptap-editor ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}

.tiptap-editor ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}
`;
    await writeTextFile(examplePath, exampleCSS);
  }
}

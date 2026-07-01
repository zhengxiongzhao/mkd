use tauri::Emitter;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};

#[cfg(target_os = "macos")]
#[tauri::command]
fn open_file_or_folder() -> Option<String> {
    use objc::runtime::{Class, Object, BOOL, YES};
    use objc::{msg_send, sel, sel_impl};

    unsafe {
        let cls = Class::get("NSOpenPanel").expect("NSOpenPanel class not found");
        let panel: *mut Object = msg_send![cls, openPanel];
        let _: () = msg_send![panel, setCanChooseFiles: YES];
        let _: () = msg_send![panel, setCanChooseDirectories: YES];
        let _: () = msg_send![panel, setAllowsMultipleSelection: BOOL::from(false)];
        let _: () = msg_send![panel, setResolvesAliases: YES];

        let result: i64 = msg_send![panel, runModal];
        // NSModalResponseOK = 1
        if result == 1 {
            let urls: *mut Object = msg_send![panel, URLs];
            let count: usize = msg_send![urls, count];
            if count > 0 {
                let url: *mut Object = msg_send![urls, objectAtIndex: 0usize];
                let path: *mut Object = msg_send![url, path];
                let cstr: *const std::os::raw::c_char = msg_send![path, UTF8String];
                if !cstr.is_null() {
                    let s = std::ffi::CStr::from_ptr(cstr).to_string_lossy().into_owned();
                    return Some(s);
                }
            }
        }
        None
    }
}

#[cfg(not(target_os = "macos"))]
#[tauri::command]
fn open_file_or_folder() -> Option<String> {
    // Fallback: use rfd or return None on non-macOS
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![open_file_or_folder])
        .setup(|app| {
            // App 菜单（macOS 系统标准：关于、隐藏、退出等）
            let app_menu = Submenu::with_items(app, "MKD", true, &[
                &PredefinedMenuItem::about(app, None, None)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::services(app, None)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::hide(app, None)?,
                &PredefinedMenuItem::hide_others(app, None)?,
                &PredefinedMenuItem::show_all(app, None)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::quit(app, None)?,
            ])?;

            // File 菜单
            let open_item = MenuItem::with_id(app, "open", "打开", true, Some("CmdOrCtrl+O"))?;
            let save_item = MenuItem::with_id(app, "save", "保存", true, Some("CmdOrCtrl+S"))?;
            let file_menu = Submenu::with_items(app, "File", true, &[
                &open_item,
                &save_item,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::close_window(app, None)?,
            ])?;

            // Edit 菜单（系统标准编辑操作）
            let edit_menu = Submenu::with_items(app, "Edit", true, &[
                &PredefinedMenuItem::undo(app, None)?,
                &PredefinedMenuItem::redo(app, None)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::cut(app, None)?,
                &PredefinedMenuItem::copy(app, None)?,
                &PredefinedMenuItem::paste(app, None)?,
                &PredefinedMenuItem::select_all(app, None)?,
            ])?;

            // Window 菜单（最小化、缩放、全屏）
            let window_menu = Submenu::with_items(app, "Window", true, &[
                &PredefinedMenuItem::minimize(app, None)?,
                &PredefinedMenuItem::maximize(app, None)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::fullscreen(app, None)?,
            ])?;

            let menu = Menu::with_items(app, &[&app_menu, &file_menu, &edit_menu, &window_menu])?;
            app.set_menu(menu)?;

            // 监听菜单事件，emit 到前端
            app.on_menu_event(move |app_handle, event| {
                let id = event.id().as_ref();
                let _ = app_handle.emit("menu-event", id);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

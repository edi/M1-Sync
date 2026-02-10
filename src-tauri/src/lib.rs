use tauri::{Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

	let mut builder = tauri::Builder::default();

	#[cfg(desktop)]
	{
		// focus on active window
		builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
			let _ = app.get_webview_window("main")
				.expect("no main window")
				.set_focus();
		}));
	}

	builder
		.setup(|app| {
			app.handle().plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))?;
			app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
			Ok(())
		})
		.plugin(tauri_plugin_opener::init())
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_clipboard_manager::init())
		.plugin(tauri_plugin_store::Builder::new().build())
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

use tauri::{
    Manager, WindowEvent,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
};

#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default().plugin(tauri_plugin_fs::init());

    #[cfg(desktop)]
    {
        // focus on active window
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            #[cfg(target_os = "macos")]
            let _ = app.set_activation_policy(ActivationPolicy::Regular);
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .setup(|app| {
            app.handle().plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                Some(vec!["--minimized"]),
            ))?;
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            // build tray menu
            let app_name = &app.package_info().name;
            let show =
                MenuItem::with_id(app, "show", format!("Open {app_name}"), true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &separator, &quit])?;

            TrayIconBuilder::new()
                .icon(if cfg!(target_os = "macos") {
                    tauri::include_image!("icons/tray.png")
                } else {
                    app.default_window_icon().unwrap().clone()
                })
                .icon_as_template(cfg!(target_os = "macos"))
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        #[cfg(target_os = "macos")]
                        let _ = app.set_activation_policy(ActivationPolicy::Regular);
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            // show the window unless launched via autostart with --minimized
            let minimized = std::env::args().any(|a| a == "--minimized");
            if minimized {
                #[cfg(target_os = "macos")]
                let _ = app.set_activation_policy(ActivationPolicy::Accessory);
            } else if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
                #[cfg(target_os = "macos")]
                let _ = window
                    .app_handle()
                    .set_activation_policy(ActivationPolicy::Accessory);
            }
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_prevent_default::debug())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

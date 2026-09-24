mod menu_bar_timer;
mod webview_dialogs;

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_local_vault_snapshot_tables",
        sql: include_str!("../migrations/001_local_vault.sql"),
        kind: MigrationKind::Up,
    }];

    let app = tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:noctyrium.db", migrations)
                .build(),
        )
        .manage(menu_bar_timer::MenuBarTimerState::default())
        .invoke_handler(tauri::generate_handler![
            menu_bar_timer::menu_bar_timer_update,
            menu_bar_timer::menu_bar_timer_clear,
        ])
        .setup(|app| {
            use tauri::Manager;
            // Without this, confirm() returns false and prompt() null in the desktop app.
            if let Some(window) = app.get_webview_window("main") {
                webview_dialogs::install(&window);
            }
            menu_bar_timer::setup(app.handle());
            Ok(())
        })
        .on_window_event(menu_bar_timer::on_window_event)
        .build(tauri::generate_context!())
        .expect("error while running Noctyrium desktop shell");

    app.run(menu_bar_timer::on_run_event);
}

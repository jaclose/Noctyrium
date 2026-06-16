use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_local_vault_snapshot_tables",
        sql: include_str!("../migrations/001_local_vault.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:noctyrium.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running Noctyrium desktop shell");
}

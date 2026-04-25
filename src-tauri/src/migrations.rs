use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
  vec![Migration {
    version: 1,
    description: "create_history_table",
    sql: r#"
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        input_audio TEXT NOT NULL,
        transcription_model TEXT NOT NULL,
        transcription_output TEXT NOT NULL,
        transcription_error TEXT,
        started_at INTEGER NOT NULL,
        completed_at INTEGER NOT NULL,
        recording_started_at INTEGER,
        recording_completed_at INTEGER,
        resampling_started_at INTEGER,
        resampling_completed_at INTEGER,
        transcription_started_at INTEGER,
        transcription_completed_at INTEGER,
        injection_started_at INTEGER,
        injection_completed_at INTEGER,
        language TEXT
      );
    "#,
    kind: MigrationKind::Up,
  }]
}

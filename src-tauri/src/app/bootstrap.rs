use crate::state::AppState;
use std::sync::Arc;
use tauri::{AppHandle, Runtime};

pub fn init_state<R: Runtime>(_app: &AppHandle<R>) -> Result<AppState, String> {
  Ok(AppState::new())
}

pub fn preload_models<R: Runtime>(
  _app: &AppHandle<R>,
  _app_state: &Arc<AppState>,
) -> Result<(), String> {
  Ok(())
}

use super::recording::{begin_recording, end_recording};
use crate::{config::load_user_config, state::AppState};
use std::sync::Arc;
use tauri::{AppHandle, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

pub fn setup_shortcut<R: Runtime>(
  app: &AppHandle<R>,
  app_state: Arc<AppState>,
) -> Result<(), String> {
  let _ = app.global_shortcut().unregister_all();
  let user_config = load_user_config(app)?;
  let hotkey = user_config.settings.hotkey.trim();

  if hotkey.is_empty() {
    return Ok(());
  }

  let parsed_hotkey = match hotkey.parse::<tauri_plugin_global_shortcut::Shortcut>() {
    Ok(shortcut) => shortcut,
    Err(err) => {
      eprintln!("Invalid hotkey '{}': {}", hotkey, err);
      return Ok(());
    }
  };

  let state_for_handler = app_state.clone();
  let register = app
    .global_shortcut()
    .on_shortcut(parsed_hotkey, move |app, _shortcut, event| {
      if event.state == ShortcutState::Pressed {
        let _ = begin_recording(app, &state_for_handler);
      }
      if event.state == ShortcutState::Released {
        let _ = end_recording(app, &state_for_handler);
      }
    });

  if let Err(err) = register {
    eprintln!("Failed to register hotkey '{}': {}", hotkey, err);
  }

  Ok(())
}

pub fn sync_shortcut<R: Runtime>(
  app: &AppHandle<R>,
  app_state: &Arc<AppState>,
  previous_hotkey: &str,
  next_hotkey: &str,
) -> Result<(), String> {
  let previous = previous_hotkey.trim();
  let next = next_hotkey.trim();

  if previous == next {
    return Ok(());
  }

  if !previous.is_empty() {
    if let Ok(parsed) = previous.parse::<tauri_plugin_global_shortcut::Shortcut>() {
      let _ = app.global_shortcut().unregister(parsed);
    }
  }

  if next.is_empty() {
    return Ok(());
  }

  let parsed_hotkey = match next.parse::<tauri_plugin_global_shortcut::Shortcut>() {
    Ok(shortcut) => shortcut,
    Err(err) => {
      eprintln!("Invalid hotkey '{}': {}", next, err);
      return Ok(());
    }
  };

  let state_for_handler = app_state.clone();
  let register = app
    .global_shortcut()
    .on_shortcut(parsed_hotkey, move |app, _shortcut, event| {
      if event.state == ShortcutState::Pressed {
        let _ = begin_recording(app, &state_for_handler);
      }
      if event.state == ShortcutState::Released {
        let _ = end_recording(app, &state_for_handler);
      }
    });

  if let Err(err) = register {
    eprintln!("Failed to register hotkey '{}': {}", next, err);
  }

  Ok(())
}

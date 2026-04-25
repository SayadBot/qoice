use std::{
  sync::{atomic::Ordering, Arc},
  thread,
  time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use tauri::{
  AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, Runtime, WebviewUrl, WebviewWindow,
  WebviewWindowBuilder,
};

use crate::{
  platform::active_window, platform::active_window::ActiveWindowMonitor, state::AppState,
};

const OVERLAY_LABEL: &str = "overlay";
const OVERLAY_WIDTH: f64 = 240.0;
const OVERLAY_HEIGHT: f64 = 40.0;
const OVERLAY_MARGIN: f64 = 24.0;
const OVERLAY_SAFE_PADDING: f64 = 24.0;
const FADE_OUT_MS: u64 = 200;
const OVERLAY_REFRESH_INTERVAL: Duration = Duration::from_millis(33);

fn now_ms() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_millis() as i64
}

pub fn ensure_overlay_window<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
  if app.get_webview_window(OVERLAY_LABEL).is_some() {
    return Ok(());
  }

  let window =
    WebviewWindowBuilder::new(app, OVERLAY_LABEL, WebviewUrl::App("overlay.html".into()))
      .title("Recording Overlay")
      .decorations(false)
      .resizable(false)
      .always_on_top(true)
      .skip_taskbar(true)
      .visible(false)
      .shadow(false)
      .transparent(true)
      .build()
      .map_err(|e: tauri::Error| e.to_string())?;

  let _ = window.set_always_on_top(true);
  let _ = window.set_focusable(false);
  let _ = window.set_skip_taskbar(true);
  let _ = window.set_ignore_cursor_events(true);
  let _ = position_overlay_with_monitor(&active_window::fallback_monitor(app), &window);

  Ok(())
}

pub fn start_overlay<R: Runtime>(app: &AppHandle<R>, state: &Arc<AppState>, started_at: i64) {
  state.overlay_started_at.store(started_at, Ordering::SeqCst);
  state.overlay_recording.store(true, Ordering::SeqCst);

  if state.overlay_active.swap(true, Ordering::SeqCst) {
    let _ = app.emit_to(OVERLAY_LABEL, "overlay-status", "recording");
    return;
  }

  let monitor =
    active_window::monitor_for_active_window(app).or_else(|| active_window::fallback_monitor(app));
  {
    let mut guard = state.overlay_monitor.lock().unwrap();
    *guard = monitor;
  }

  if ensure_overlay_window(app).is_err() {
    let mut guard = state.overlay_monitor.lock().unwrap();
    *guard = None;
    state.overlay_active.store(false, Ordering::SeqCst);
    state.overlay_recording.store(false, Ordering::SeqCst);
    return;
  }

  let elapsed = now_ms().saturating_sub(started_at);

  if let Some(window) = app.get_webview_window(OVERLAY_LABEL) {
    let _ = position_overlay(state, &window);
    let _ = window.set_always_on_top(true);
    let _ = window.set_focusable(false);
    let _ = window.set_ignore_cursor_events(true);
    let _ = window.show();
  }

  let _ = app.emit_to(OVERLAY_LABEL, "overlay-show", elapsed);
  let _ = app.emit_to(OVERLAY_LABEL, "overlay-status", "recording");

  let app_handle = app.clone();
  let state = Arc::clone(state);
  thread::spawn(move || {
    let mut last_tick_sent = Instant::now() - Duration::from_secs(1);

    loop {
      if !state.overlay_active.load(Ordering::SeqCst) {
        break;
      }

      if state.overlay_recording.load(Ordering::SeqCst) {
        if last_tick_sent.elapsed() >= Duration::from_secs(1) {
          let started_at = state.overlay_started_at.load(Ordering::SeqCst);
          let elapsed = now_ms().saturating_sub(started_at);
          let _ = app_handle.emit_to(OVERLAY_LABEL, "overlay-tick", elapsed);
          last_tick_sent = Instant::now();
        }

        if let Some(spectrum) = recording_spectrum_snapshot(&state) {
          let _ = app_handle.emit_to(OVERLAY_LABEL, "overlay-spectrum", spectrum);
        }
      }
      thread::sleep(OVERLAY_REFRESH_INTERVAL);
    }
  });
}

pub fn stop_overlay<R: Runtime>(app: &AppHandle<R>, state: &Arc<AppState>) {
  if !state.overlay_active.swap(false, Ordering::SeqCst) {
    return;
  }

  state.overlay_recording.store(false, Ordering::SeqCst);

  {
    let mut guard = state.overlay_monitor.lock().unwrap();
    *guard = None;
  }

  state.overlay_recording.store(false, Ordering::SeqCst);

  let _ = app.emit_to(OVERLAY_LABEL, "overlay-hide", ());

  let app_handle = app.clone();
  thread::spawn(move || {
    thread::sleep(Duration::from_millis(FADE_OUT_MS));
    if let Some(window) = app_handle.get_webview_window(OVERLAY_LABEL) {
      let _ = window.hide();
    }
  });
}

pub fn set_overlay_status<R: Runtime>(app: &AppHandle<R>, state: &Arc<AppState>, status: &str) {
  if !state.overlay_active.load(Ordering::SeqCst) {
    return;
  }

  let _ = app.emit_to(OVERLAY_LABEL, "overlay-status", status);
}

pub fn stop_overlay_recording(state: &Arc<AppState>) {
  state.overlay_recording.store(false, Ordering::SeqCst);
}

fn recording_spectrum_snapshot(state: &Arc<AppState>) -> Option<Vec<f32>> {
  let sessions = state.active_sessions.lock().unwrap();
  sessions
    .values()
    .max_by_key(|session| session.recording_started_at)
    .map(|session| session.recorder.spectrum_snapshot())
}

fn position_overlay<R: Runtime>(
  state: &Arc<AppState>,
  overlay: &WebviewWindow<R>,
) -> Result<(), String> {
  let monitor = {
    let guard = state.overlay_monitor.lock().unwrap();
    guard.ok_or("No monitor available")?
  };

  position_overlay_with_monitor(&Some(monitor), overlay)
}

fn position_overlay_with_monitor<R: Runtime>(
  monitor: &Option<ActiveWindowMonitor>,
  overlay: &WebviewWindow<R>,
) -> Result<(), String> {
  let monitor = monitor.ok_or("No monitor available")?;

  let ActiveWindowMonitor {
    scale_factor,
    position,
    size,
  } = monitor;

  let window_width = (OVERLAY_WIDTH + OVERLAY_SAFE_PADDING * 2.0) * scale_factor;
  let window_height = (OVERLAY_HEIGHT + OVERLAY_SAFE_PADDING * 2.0) * scale_factor;
  let window_width = window_width.ceil();
  let window_height = window_height.ceil();
  let overlay_margin = (OVERLAY_MARGIN * scale_factor).ceil();

  let x = (position.x * scale_factor + (size.width * scale_factor - window_width) / 2.0).round();
  let y = (position.y * scale_factor + size.height * scale_factor - window_height - overlay_margin)
    .round();

  overlay
    .set_size(PhysicalSize::new(window_width, window_height))
    .map_err(|e: tauri::Error| e.to_string())?;
  overlay
    .set_position(PhysicalPosition::new(x, y))
    .map_err(|e: tauri::Error| e.to_string())?;

  Ok(())
}

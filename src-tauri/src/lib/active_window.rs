use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, Runtime};

#[derive(Clone, Copy)]
pub struct ActiveWindowMonitor {
  pub scale_factor: f64,
  pub position: LogicalPosition<f64>,
  pub size: LogicalSize<f64>,
}

pub fn monitor_for_active_window<R: Runtime>(app: &AppHandle<R>) -> Option<ActiveWindowMonitor> {
  let active = active_win_pos_rs::get_active_window().ok()?;
  let center_x = active.position.x + active.position.width / 2.0;
  let center_y = active.position.y + active.position.height / 2.0;

  let main = app.get_webview_window("main")?;
  let monitor = main
    .monitor_from_point(center_x as f64, center_y as f64)
    .ok()
    .flatten()?;
  let scale_factor = monitor.scale_factor();
  let size = monitor.size().to_logical::<f64>(scale_factor);
  let position = monitor.position().to_logical::<f64>(scale_factor);

  Some(ActiveWindowMonitor {
    scale_factor,
    position,
    size,
  })
}

pub fn fallback_monitor<R: Runtime>(app: &AppHandle<R>) -> Option<ActiveWindowMonitor> {
  let main = app.get_webview_window("main")?;
  let monitor = main.primary_monitor().ok().flatten().or_else(|| {
    main
      .available_monitors()
      .ok()
      .and_then(|monitors| monitors.into_iter().next())
  })?;
  let scale_factor = monitor.scale_factor();
  let size = monitor.size().to_logical::<f64>(scale_factor);
  let position = monitor.position().to_logical::<f64>(scale_factor);

  Some(ActiveWindowMonitor {
    scale_factor,
    position,
    size,
  })
}

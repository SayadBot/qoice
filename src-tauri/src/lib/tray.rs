#![cfg(desktop)]

use std::sync::Arc;

use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  AppHandle, Manager, Runtime, WebviewUrl, WebviewWindowBuilder,
};

use crate::state::AppState;

pub fn create_tray<R: Runtime>(app: &AppHandle<R>, _state: Arc<AppState>) -> tauri::Result<()> {
  let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
  let hide_i = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
  let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

  let menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

  let mut builder = TrayIconBuilder::with_id("woice")
    .tooltip("Woice")
    .menu(&menu)
    .show_menu_on_left_click(false);

  if let Some(icon) = app.default_window_icon() {
    builder = builder.icon(icon.clone());
  }

  let _ = builder
    .on_menu_event(move |app, event| match event.id.as_ref() {
      "show" => {
        show_main_window(app);
      }
      "hide" => {
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.hide();
        }
      }
      "quit" => {
        app.exit(0);
      }
      _ => {}
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        let app = tray.app_handle();
        show_main_window(app);
      }
    })
    .build(app);

  Ok(())
}

fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    return;
  }

  if let Ok(window) = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
    .title("Woice")
    .decorations(false)
    .inner_size(1024.0, 768.0)
    .min_inner_size(720.0, 640.0)
    .shadow(true)
    .theme(Some(tauri::Theme::Dark))
    .visible(true)
    .build()
  {
    let _ = window.set_focus();
  }
}

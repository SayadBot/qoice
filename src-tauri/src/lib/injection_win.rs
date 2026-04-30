use arboard::Clipboard;
use enigo::{Direction, Enigo, Key, Keyboard, Settings};

pub fn inject_text(text: &str) -> Result<(), String> {
  if text.is_empty() {
    return Ok(());
  }

  let mut clipboard = Clipboard::new().map_err(|e| format!("Clipboard init failed: {e}"))?;
  clipboard
    .set_text(text)
    .map_err(|e| format!("Clipboard set failed: {e}"))?;

  let mut enigo =
    Enigo::new(&Settings::default()).map_err(|e| format!("Input injection failed: {e}"))?;

  let modifier = Key::Control;

  enigo
    .key(modifier, Direction::Press)
    .map_err(|e| e.to_string())?;

  enigo
    .key(Key::Unicode('v'), Direction::Click)
    .map_err(|e| e.to_string())?;

  enigo
    .key(modifier, Direction::Release)
    .map_err(|e| e.to_string())?;

  Ok(())
}

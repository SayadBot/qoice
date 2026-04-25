use std::path::PathBuf;

use rodio::{Decoder, OutputStream, Sink};

fn get_sound_path(name: &str) -> PathBuf {
  let exe_path = std::env::current_exe().expect("Failed to get current exe");
  let resources_dir = if cfg!(target_os = "macos") {
    exe_path
      .parent()
      .and_then(|p| p.parent())
      .and_then(|p| p.parent())
      .map(|p| p.join("Resources"))
      .expect("Failed to get resources dir")
  } else {
    exe_path
      .parent()
      .map(|p| p.join("sounds"))
      .expect("Failed to get sounds dir")
  };
  resources_dir.join(format!("recording-{}.mp3", name))
}

fn play_mp3(path: PathBuf) {
  std::thread::spawn(move || {
    let file = match std::fs::File::open(&path) {
      Ok(f) => f,
      Err(e) => {
        eprintln!("Failed to open sound file {:?}: {}", path, e);
        return;
      }
    };

    let (_stream, stream_handle) = match OutputStream::try_default() {
      Ok(pair) => pair,
      Err(e) => {
        eprintln!("Failed to create output stream: {}", e);
        return;
      }
    };

    let sink = match Sink::try_new(&stream_handle) {
      Ok(s) => s,
      Err(e) => {
        eprintln!("Failed to create sink: {}", e);
        return;
      }
    };

    let source = match Decoder::new(std::io::BufReader::new(file)) {
      Ok(s) => s,
      Err(e) => {
        eprintln!("Failed to decode MP3: {}", e);
        return;
      }
    };

    sink.append(source);
    sink.sleep_until_end();
  });
}

pub fn play_error_sound() {
  let path = get_sound_path("error");
  play_mp3(path);
}

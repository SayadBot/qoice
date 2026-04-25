use std::{
  collections::VecDeque,
  sync::{
    atomic::{AtomicBool, Ordering},
    mpsc::{self, Receiver, Sender},
    Arc, Mutex,
  },
  thread,
  time::{Duration, Instant},
};

use cpal::{
  traits::{DeviceTrait, HostTrait, StreamTrait},
  SampleFormat, StreamConfig,
};
use rustfft::{num_complex::Complex, FftPlanner};

const FFT_SIZE: usize = 1024;
const SPECTRUM_BINS: usize = 28;
const SPECTRUM_FPS_INTERVAL: Duration = Duration::from_millis(33);

pub struct RecorderHandle {
  stop_flag: Arc<AtomicBool>,
  spectrum: Arc<Mutex<Vec<f32>>>,
  join: Option<thread::JoinHandle<RecordedAudio>>,
}

pub struct RecordedAudio {
  pub samples: Vec<f32>,
  pub sample_rate: u32,
  #[allow(dead_code)]
  pub duration_ms: u64,
}

impl RecorderHandle {
  pub fn stop(mut self) -> RecordedAudio {
    self.stop_flag.store(true, Ordering::SeqCst);
    self.join.take().expect("record thread").join().unwrap()
  }

  pub fn spectrum_snapshot(&self) -> Vec<f32> {
    self.spectrum.lock().unwrap().clone()
  }
}

pub fn start_recording() -> Result<RecorderHandle, String> {
  let host = cpal::default_host();
  let device = host
    .default_input_device()
    .ok_or_else(|| "No input device available".to_string())?;
  let config = device.default_input_config().map_err(|e| e.to_string())?;

  let sample_rate = config.sample_rate().0;
  let stop_flag = Arc::new(AtomicBool::new(false));
  let stop_flag_thread = stop_flag.clone();
  let spectrum = Arc::new(Mutex::new(vec![0.04; SPECTRUM_BINS]));
  let spectrum_thread = spectrum.clone();

  let (tx, rx) = mpsc::channel::<Vec<f32>>();
  let join = thread::spawn(move || {
    let stream = build_stream(device, config, tx).expect("build stream");
    let start = Instant::now();
    let _ = stream.play();
    collect_audio(rx, stop_flag_thread, sample_rate, start, spectrum_thread)
  });

  Ok(RecorderHandle {
    stop_flag,
    spectrum,
    join: Some(join),
  })
}

pub fn resample_to_16k(audio: &RecordedAudio) -> Vec<f32> {
  if audio.sample_rate == 16_000 {
    return audio.samples.clone();
  }
  let ratio = 16_000.0 / audio.sample_rate as f32;
  let out_len = (audio.samples.len() as f32 * ratio).round() as usize;
  let mut out = Vec::with_capacity(out_len);
  for i in 0..out_len {
    let src_pos = i as f32 / ratio;
    let src_idx = src_pos.floor() as usize;
    let next_idx = (src_idx + 1).min(audio.samples.len().saturating_sub(1));
    let t = src_pos - src_idx as f32;
    let a = audio.samples.get(src_idx).copied().unwrap_or(0.0);
    let b = audio.samples.get(next_idx).copied().unwrap_or(a);
    out.push(a + (b - a) * t);
  }
  out
}

fn build_stream(
  device: cpal::Device,
  supported_config: cpal::SupportedStreamConfig,
  tx: Sender<Vec<f32>>,
) -> Result<cpal::Stream, cpal::BuildStreamError> {
  let sample_format = supported_config.sample_format();
  let config: StreamConfig = supported_config.into();
  let channels = config.channels as usize;

  let err_fn = |err| {
    eprintln!("audio stream error: {err}");
  };

  match sample_format {
    SampleFormat::F32 => device.build_input_stream(
      &config,
      move |data: &[f32], _| {
        let mut out = Vec::with_capacity(data.len() / channels.max(1));
        if channels <= 1 {
          out.extend_from_slice(data);
        } else {
          for frame in data.chunks(channels) {
            let sum: f32 = frame.iter().sum();
            out.push(sum / channels as f32);
          }
        }
        let _ = tx.send(out);
      },
      err_fn,
      None,
    ),
    SampleFormat::I16 => device.build_input_stream(
      &config,
      move |data: &[i16], _| {
        let mut out = Vec::with_capacity(data.len() / channels.max(1));
        if channels <= 1 {
          for sample in data {
            out.push(*sample as f32 / i16::MAX as f32);
          }
        } else {
          for frame in data.chunks(channels) {
            let mut sum = 0.0_f32;
            for sample in frame {
              sum += *sample as f32 / i16::MAX as f32;
            }
            out.push(sum / channels as f32);
          }
        }
        let _ = tx.send(out);
      },
      err_fn,
      None,
    ),
    SampleFormat::U16 => device.build_input_stream(
      &config,
      move |data: &[u16], _| {
        let mut out = Vec::with_capacity(data.len() / channels.max(1));
        if channels <= 1 {
          for sample in data {
            out.push((*sample as f32 - 32768.0) / 32768.0);
          }
        } else {
          for frame in data.chunks(channels) {
            let mut sum = 0.0_f32;
            for sample in frame {
              sum += (*sample as f32 - 32768.0) / 32768.0;
            }
            out.push(sum / channels as f32);
          }
        }
        let _ = tx.send(out);
      },
      err_fn,
      None,
    ),
    _ => unreachable!(),
  }
}

fn collect_audio(
  rx: Receiver<Vec<f32>>,
  stop_flag: Arc<AtomicBool>,
  sample_rate: u32,
  start: Instant,
  spectrum: Arc<Mutex<Vec<f32>>>,
) -> RecordedAudio {
  let mut samples = Vec::new();
  let mut rolling_window = VecDeque::with_capacity(FFT_SIZE);
  let mut planner = FftPlanner::<f32>::new();
  let fft = planner.plan_fft_forward(FFT_SIZE);
  let mut last_spectrum_tick = Instant::now() - SPECTRUM_FPS_INTERVAL;
  let mut smoothed = vec![0.04; SPECTRUM_BINS];
  let mut baseline = 0.03_f32;

  loop {
    if stop_flag.load(Ordering::SeqCst) {
      break;
    }

    if let Ok(chunk) = rx.recv_timeout(std::time::Duration::from_millis(25)) {
      samples.extend_from_slice(&chunk);

      for sample in &chunk {
        if rolling_window.len() == FFT_SIZE {
          rolling_window.pop_front();
        }
        rolling_window.push_back(*sample);
      }

      if rolling_window.len() == FFT_SIZE && last_spectrum_tick.elapsed() >= SPECTRUM_FPS_INTERVAL {
        let mut fft_input: Vec<Complex<f32>> = rolling_window
          .iter()
          .enumerate()
          .map(|(index, sample)| {
            let window = 0.5
              - 0.5 * (2.0 * std::f32::consts::PI * index as f32 / (FFT_SIZE as f32 - 1.0)).cos();
            Complex {
              re: sample * window,
              im: 0.0,
            }
          })
          .collect();

        fft.process(&mut fft_input);

        let mut bins = [0.0; SPECTRUM_BINS];
        let max_index = FFT_SIZE / 2;

        for (bin_index, bin_value) in bins.iter_mut().enumerate() {
          let start =
            ((bin_index as f32 / SPECTRUM_BINS as f32).powf(2.15) * max_index as f32) as usize;
          let end = (((bin_index + 1) as f32 / SPECTRUM_BINS as f32).powf(2.15) * max_index as f32)
            as usize;
          let start = start.clamp(1, max_index.saturating_sub(2));
          let end = end.clamp(start + 1, max_index.saturating_sub(1));

          let mut sum = 0.0_f32;
          let mut count = 0usize;
          for value in &fft_input[start..end] {
            sum += value.norm();
            count += 1;
          }

          let average = if count > 0 { sum / count as f32 } else { 0.0 };
          *bin_value = (average + 1e-6).ln_1p();
        }

        let peak = bins
          .iter()
          .copied()
          .fold(0.0_f32, |acc, value| if value > acc { value } else { acc })
          .max(0.001);

        baseline = baseline * 0.95 + peak * 0.05;

        for (index, value) in bins.iter().enumerate() {
          let normalized = (value / (baseline * 2.1)).clamp(0.0, 1.0);
          let target = normalized.powf(0.8);
          smoothed[index] = smoothed[index] * 0.62 + target * 0.38;
          smoothed[index] = smoothed[index].max(0.03);
        }

        *spectrum.lock().unwrap() = smoothed.clone();
        last_spectrum_tick = Instant::now();
      }
    }
  }

  let duration_ms = start.elapsed().as_millis() as u64;
  RecordedAudio {
    samples,
    sample_rate,
    duration_ms,
  }
}

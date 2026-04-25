use std::time::{SystemTime, UNIX_EPOCH};

pub mod groq;

#[derive(Clone)]
pub struct ModeRunOutput {
  pub transcription_model: String,
  pub transcription_output: String,
  pub transcription_error: Option<String>,
  pub final_text: String,
  pub transcription_started_at: Option<i64>,
  pub transcription_completed_at: Option<i64>,
}

pub fn now_ms() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_millis() as i64
}

pub fn wav_bytes_from_f32_16k(samples: &[f32]) -> Vec<u8> {
  let num_samples = samples.len() as u32;
  let sample_rate: u32 = 16_000;
  let num_channels: u16 = 1;
  let bits_per_sample: u16 = 16;
  let byte_rate = sample_rate * num_channels as u32 * bits_per_sample as u32 / 8;
  let block_align = num_channels * bits_per_sample / 8;
  let data_size = num_samples * 2;

  let mut bytes = Vec::with_capacity((44 + data_size) as usize);
  bytes.extend_from_slice(b"RIFF");
  bytes.extend_from_slice(&(36 + data_size).to_le_bytes());
  bytes.extend_from_slice(b"WAVE");
  bytes.extend_from_slice(b"fmt ");
  bytes.extend_from_slice(&16u32.to_le_bytes());
  bytes.extend_from_slice(&1u16.to_le_bytes());
  bytes.extend_from_slice(&num_channels.to_le_bytes());
  bytes.extend_from_slice(&sample_rate.to_le_bytes());
  bytes.extend_from_slice(&byte_rate.to_le_bytes());
  bytes.extend_from_slice(&block_align.to_le_bytes());
  bytes.extend_from_slice(&bits_per_sample.to_le_bytes());
  bytes.extend_from_slice(b"data");
  bytes.extend_from_slice(&data_size.to_le_bytes());

  for &sample in samples {
    let value = (sample.clamp(-1.0, 1.0) * 32767.0) as i16;
    bytes.extend_from_slice(&value.to_le_bytes());
  }

  bytes
}

mod bootstrap;
mod recording;
mod shortcuts;

pub use bootstrap::{init_state, preload_models};
pub use shortcuts::{setup_shortcut, sync_shortcut};

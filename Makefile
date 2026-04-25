FRONTEND_DIR = .
TAURI_DIR = src-tauri

install:
	pnpm install
	cd $(TAURI_DIR) && cargo fetch

dev:
	pnpm tauri dev

build:
	pnpm tauri build

ts-check:
	pnpm exec tsc --noEmit && pnpm lint:fix

cargo-check:
	cd $(TAURI_DIR) && cargo check && cargo clippy -- -D warnings

cargo-test:
	cd $(TAURI_DIR) && cargo test

clean:
	rm -rf dist
	rm -rf $(TAURI_DIR)/target

rebuild:
	rm -rf dist
	rm -rf $(TAURI_DIR)/target
	pnpm tauri build

icon:
	pnpm tauri icon ./public/logo.svg
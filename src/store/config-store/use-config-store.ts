import { invoke } from '@tauri-apps/api/core'
import * as autoStart from '@tauri-apps/plugin-autostart'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { readUserConfig, writeUserConfig } from './config-fs'
import { settingsSchema, TSettingsSchema } from './config-schema'

type InitialState = {
  settings: TSettingsSchema
  autostartEnabled: boolean
}

async function getInitialState(): Promise<InitialState> {
  const userConfig = await readUserConfig()

  const resolvedSettings = userConfig?.settings ?? settingsSchema.parse({})

  return {
    settings: resolvedSettings,
    autostartEnabled: await autoStart.isEnabled(),
  }
}

const initialState = await getInitialState()

export const useConfigStore = create(
  combine(initialState, (set) => ({
    setSettings(settings: TSettingsSchema) {
      return set({ settings })
    },

    updateSettings(updates: Partial<TSettingsSchema>) {
      return set((prev) => ({
        settings: { ...prev.settings, ...updates },
      }))
    },

    async setAutostartEnabled(enabled: boolean) {
      if (enabled) {
        await autoStart.enable()
      } else {
        await autoStart.disable()
      }

      return set({ autostartEnabled: enabled })
    },
  }))
)

console.log('initial state', initialState)
let configWriteQueue = Promise.resolve()
let previousHotkey = initialState.settings.hotkey

useConfigStore.subscribe((state) => {
  configWriteQueue = configWriteQueue
    .then(async () => {
      console.log('writing config', state)

      await writeUserConfig({
        settings: state.settings,
      })

      const nextHotkey = state.settings.hotkey
      if (previousHotkey !== nextHotkey) {
        await invoke('sync_hotkey_command', {
          previousHotkey: previousHotkey,
          nextHotkey: nextHotkey,
        })
        previousHotkey = nextHotkey
      }
    })
    .catch((error) => {
      console.error('failed to persist config state', error)
    })
})

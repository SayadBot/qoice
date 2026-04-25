import * as path from '@tauri-apps/api/path'
import { exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { configSchema, TConfigSchema } from './config-schema'

const CONFIG_FILE_NAME = 'config.json'

export async function readUserConfig(): Promise<TConfigSchema | null> {
  const home = await path.appConfigDir()
  const configPath = await path.join(home, CONFIG_FILE_NAME)

  if (!(await exists(configPath))) {
    return null
  }

  const base = await readTextFile(configPath)
  try {
    return configSchema.parse(JSON.parse(base))
  } catch (error) {
    console.error('error parsing config', error)
    return configSchema.parse({})
  }
}

export async function writeUserConfig(config: TConfigSchema) {
  const home = await path.appConfigDir()
  const configPath = await path.join(home, CONFIG_FILE_NAME)

  await writeTextFile(configPath, JSON.stringify(config, null, 2))
}

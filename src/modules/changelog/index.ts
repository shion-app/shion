import { invoke } from '@tauri-apps/api/core'

export interface Release {
  version: string
  title: string
  notes: string
}

type Changelog = Record<string, Release>

export async function parseChangelog(text: string, version: string): Promise<Release | undefined> {
  const map = await invoke<Changelog>('parse_changelog_from_text', { text })
  return map[version]
}

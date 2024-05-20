import { invoke } from '@tauri-apps/api/core'

interface Release {
  version: string
  title: string
  notes: string
}

type Changelog = Map<string, Release>

export async function parseChangelog(text: string, version: string) {
  const map = await invoke<Changelog>('parse_changelog_from_text', { text })
  return map.get(version)
}

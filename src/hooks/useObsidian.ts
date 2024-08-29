import { invoke } from '@tauri-apps/api/core'

export interface ObsidianNote extends ObsidianNoteResult {
  color: string
}

interface ObsidianNoteResult {
  name: string
  path: string
  created: number
  updated: number
}

export function useObsidian() {
  const configStore = useConfigStore()
  const extensionStore = useExtensionStore()

  const { config } = storeToRefs(configStore)
  const { config: extensionConfig } = storeToRefs(extensionStore)

  async function getList(start: number, end: number): Promise<Array<ObsidianNote>> {
    return (await Promise.all(extensionConfig.value.obsidian.workspace.map(path =>
      invoke<Array<ObsidianNoteResult>>('read_obsidian', {
        path,
        createdKey: extensionConfig.value.obsidian.created,
        updatedKey: extensionConfig.value.obsidian.updated,
      })))).flat().filter(i => i.created > start && i.created < end).map(i => ({
      ...i,
      color: config.value.themeColor,
    }))
  }

  return {
    getList,
  }
}

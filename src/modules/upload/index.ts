import { nanoid } from 'nanoid'
import { BaseDirectory, copyFile, mkdir, writeFile } from '@tauri-apps/plugin-fs'
import { appDataDir, extname, resolve } from '@tauri-apps/api/path'
import { core } from '@tauri-apps/api'

const UPLOAD_DIR = 'upload'

async function getUploadPath(name: string) {
  const id = nanoid()
  const ext = await extname(name)
  return `${UPLOAD_DIR}/${id}.${ext}`
}

export async function upload(name: string, buffer: ArrayBuffer) {
  const dest = await getUploadPath(name)
  await mkdir(UPLOAD_DIR, { baseDir: BaseDirectory.AppData, recursive: true })
  await writeFile(dest, new Uint8Array(buffer), { baseDir: BaseDirectory.AppData })
  const appDataDirPath = await appDataDir()
  const path = await resolve(appDataDirPath, dest)
  return core.convertFileSrc(path)
}

export async function uploadByPath(path: string) {
  const dest = await getUploadPath(path)
  await copyFile(path, dest, {
    toPathBaseDir: BaseDirectory.AppData,
  })
  return core.convertFileSrc(path)
}

export const uploadExtension = {
  image: ['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'],
  video: ['mp4', 'webm'],
}

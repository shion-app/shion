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

async function ensureUpload() {
  await mkdir(UPLOAD_DIR, { baseDir: BaseDirectory.AppData, recursive: true })
}

export async function upload(name: string, buffer: ArrayBuffer) {
  await ensureUpload()
  const dest = await getUploadPath(name)
  await writeFile(dest, new Uint8Array(buffer), { baseDir: BaseDirectory.AppData })
  const appDataDirPath = await appDataDir()
  const path = await resolve(appDataDirPath, dest)
  return core.convertFileSrc(path)
}

export async function uploadByPath(target: string) {
  await ensureUpload()
  const dest = await getUploadPath(target)
  await copyFile(target, dest, {
    toPathBaseDir: BaseDirectory.AppData,
  })
  const appDataDirPath = await appDataDir()
  const path = await resolve(appDataDirPath, dest)
  return core.convertFileSrc(path)
}

export const uploadExtension = {
  image: ['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'],
  video: ['mp4', 'webm'],
}

import { nanoid } from 'nanoid'
import { BaseDirectory, createDir, writeBinaryFile } from '@tauri-apps/api/fs'
import { appDataDir, extname, resolve } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/tauri'

function readFile(file: File): Promise<{ name: string; buffer: ArrayBuffer }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener(
      'load',
      () => {
        resolve({
          name: file.name,
          buffer: reader.result as ArrayBuffer,
        })
      },
    )
    reader.readAsArrayBuffer(file)
  })
}

export async function uploadFile(file: File) {
  const { name, buffer } = await readFile(file)
  return await upload(name, buffer)
}

export async function upload(name: string, buffer: ArrayBuffer) {
  const id = nanoid()
  const ext = await extname(name)
  const uploadDir = 'upload'
  const target = `${uploadDir}/${id}.${ext}`
  await createDir(uploadDir, { dir: BaseDirectory.AppData, recursive: true })
  await writeBinaryFile(target, buffer, { dir: BaseDirectory.AppData })
  const appDataDirPath = await appDataDir()
  const path = await resolve(appDataDirPath, target)
  return convertFileSrc(path)
}

export function isImage(file: File) {
  return file.type.includes('image')
}

export function isWebImage(file: File) {
  return ['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)
}

export function isVideo(file: File) {
  return file.type.includes('video')
}

export function isWebVideo(file: File) {
  return ['video/mp4', 'video/webm'].includes(file.type)
}

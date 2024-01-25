import { nanoid } from 'nanoid'
import { BaseDirectory, copyFile, mkdir, remove, writeFile } from '@tauri-apps/plugin-fs'
import { appDataDir, extname, resolve } from '@tauri-apps/api/path'
import { core } from '@tauri-apps/api'

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

async function getUploadPath(name: string) {
  const id = nanoid()
  const ext = await extname(name)
  const uploadDir = 'upload'
  return {
    uploadDir,
    dest: `${uploadDir}/${id}.${ext}`,
  }
}

export async function upload(name: string, buffer: ArrayBuffer) {
  const { uploadDir, dest } = await getUploadPath(name)
  await mkdir(uploadDir, { baseDir: BaseDirectory.AppData, recursive: true })
  await writeFile(dest, new Uint8Array(buffer), { baseDir: BaseDirectory.AppData })
  const appDataDirPath = await appDataDir()
  const path = await resolve(appDataDirPath, dest)
  return {
    asset: core.convertFileSrc(path),
    remove: () => remove(dest, {
      baseDir: BaseDirectory.AppData,
    }),
  }
}

export async function uploadByPath(path: string) {
  const { dest } = await getUploadPath(path)
  await copyFile(path, dest, {
    toPathBaseDir: BaseDirectory.AppData,
  })
  return core.convertFileSrc(path)
}

export const uploadExtension = {
  image: ['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'],
  video: ['mp4', 'webm'],
}

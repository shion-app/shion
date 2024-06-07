import type { Editor } from '@tiptap/vue-3'
import { getType as getUploadType } from '@/modules/upload'

export function insert(editor: Editor, list: Array<{
  src: string
  type: string
}>) {
  editor.commands.insertContent(list.map(({ type, src }) => ({
    type,
    attrs: {
      src,
    },
  })))
}

export function getType(ext: string) {
  const type = getUploadType(ext)
  if (type == 'image')
    return 'imageBlock'
  else
    return type
}

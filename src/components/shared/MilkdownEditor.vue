<script setup lang="ts">
import { Editor, editorViewOptionsCtx, rootCtx } from '@milkdown/core'
import { nord } from '@milkdown/theme-nord'
import { Milkdown, useEditor } from '@milkdown/vue'
import { commonmark } from '@milkdown/preset-commonmark'
import { history } from '@milkdown/plugin-history'
import type { Uploader } from '@milkdown/plugin-upload'
import { upload, uploadConfig } from '@milkdown/plugin-upload'
import type { Node } from '@milkdown/prose/model'

import '@milkdown/theme-nord/style.css'

import { uploadFile } from '@modules/upload'

const uploader: Uploader = async (files, schema) => {
  const images: File[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files.item(i)
    if (!file)
      continue

    if (!file.type.includes('image'))
      continue

    images.push(file)
  }

  const nodes: Node[] = await Promise.all(
    images.map(async (image) => {
      const src = await uploadFile(image)
      const alt = image.name
      return schema.nodes.image.createAndFill({
        src,
        alt,
      }) as Node
    }),
  )

  return nodes
}

useEditor((root) => {
  const editor = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root)
      // ctx.set(defaultValueCtx, markdown)

      // Add attributes to the editor container
      ctx.update(editorViewOptionsCtx, prev => ({
        ...prev,
        attributes: { class: 'milkdown-editor mx-auto outline-none min-h-full', spellcheck: 'false' },
      }))

      ctx.update(uploadConfig.key, prev => ({
        ...prev,
        uploader,
      }))
    })
    .config(nord)
    .use(commonmark)
    .use(history)
    .use(upload)

  return editor
})
</script>

<template>
  <Milkdown h-full />
</template>

<style>
.milkdown {
  @apply  p-8 mx-4 h-full overflow-y-auto;
}
</style>

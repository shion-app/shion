<script setup lang="ts">
import type { CmdKey } from '@milkdown/core'
import { Editor, editorViewCtx, editorViewOptionsCtx, parserCtx, rootCtx } from '@milkdown/core'
import { nord } from '@milkdown/theme-nord'
import { Milkdown, useEditor } from '@milkdown/vue'
import { commonmark, toggleEmphasisCommand, toggleStrongCommand, wrapInBlockquoteCommand, wrapInBulletListCommand, wrapInOrderedListCommand } from '@milkdown/preset-commonmark'
import { history, redoCommand, undoCommand } from '@milkdown/plugin-history'
import type { Uploader } from '@milkdown/plugin-upload'
import { upload, uploadConfig } from '@milkdown/plugin-upload'
import { type Node, Slice } from '@milkdown/prose/model'
import { callCommand } from '@milkdown/utils'
import { listener, listenerCtx } from '@milkdown/plugin-listener'

import '@milkdown/theme-nord/style.css'

import { uploadFile } from '@modules/upload'

const props = withDefaults(defineProps<{
  content: string
  editable?: boolean
}>(), {
  editable: true,
})

const { content: contentVModel } = useVModels(props)

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

const editor = useEditor(root => Editor.make()
  .config((ctx) => {
    ctx.set(rootCtx, root)

    ctx.update(editorViewOptionsCtx, prev => ({
      ...prev,
      attributes: { class: 'milkdown-editor mx-auto outline-none min-h-full', spellcheck: 'false' },
      editable: () => props.editable,
    }))

    ctx.update(uploadConfig.key, prev => ({
      ...prev,
      uploader,
    }))

    const listener = ctx.get(listenerCtx)
    listener.markdownUpdated((ctx, markdown) => {
      contentVModel.value = markdown
    })
  })
  .config(nord)
  .use(commonmark)
  .use(history)
  .use(upload)
  .use(listener),
)

function call<T>(command: CmdKey<T>, payload?: T) {
  return editor.get()?.action(callCommand(command, payload))
}

watchOnce(() => props.content, v =>
  editor.get()?.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    const parser = ctx.get(parserCtx)
    const doc = parser(v)
    if (!doc)
      return
    const state = view.state
    view.dispatch(
      state.tr.replace(
        0,
        state.doc.content.size,
        new Slice(doc.content, 0, 0),
      ),
    )
  }))
</script>

<template>
  <div v-if="$props.editable" flex border-b p-2>
    <div text-6 cursor-pointer i-mdi:undo @click="call(undoCommand.key)" />
    <div text-6 cursor-pointer i-mdi:redo @click="call(redoCommand.key)" />
    <div text-6 cursor-pointer i-mdi:format-bold @click="call(toggleStrongCommand.key)" />
    <div text-6 cursor-pointer i-mdi:format-italic @click="call(toggleEmphasisCommand.key)" />
    <div text-6 cursor-pointer i-mdi:format-list-bulleted @click="call(wrapInBulletListCommand.key)" />
    <div text-6 cursor-pointer i-mdi:format-list-numbered @click="call(wrapInOrderedListCommand.key)" />
    <div text-6 cursor-pointer i-mdi:format-quote-close @click="call(wrapInBlockquoteCommand.key)" />
  </div>
  <Milkdown />
</template>

<style>
.milkdown {
  @apply  p-8 mx-4 h-full overflow-y-auto;
}
</style>

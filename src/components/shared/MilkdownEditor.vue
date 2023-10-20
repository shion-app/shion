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

const { t } = useI18n()

const { content: contentVModel } = useVModels(props)

const utils = computed(() => [
  {
    icon: 'i-mdi:undo',
    tip: t('moment.editor.uodo'),
    handler: () => call(undoCommand.key),
  },
  {
    icon: 'i-mdi:redo',
    tip: t('moment.editor.redo'),
    handler: () => call(redoCommand.key),
  },
  {
    icon: 'i-mdi:format-bold',
    tip: t('moment.editor.bold'),
    handler: () => call(toggleStrongCommand.key),
  },
  {
    icon: 'i-mdi:format-italic',
    tip: t('moment.editor.italic'),
    handler: () => call(toggleEmphasisCommand.key),
  },
  {
    icon: 'i-mdi:format-list-bulleted',
    tip: t('moment.editor.listBulleted'),
    handler: () => call(wrapInBulletListCommand.key),
  },
  {
    icon: 'i-mdi:format-list-numbered',
    tip: t('moment.editor.listNumbered'),
    handler: () => call(wrapInOrderedListCommand.key),
  },
  {
    icon: 'i-mdi:format-quote-close',
    tip: t('moment.editor.quote'),
    handler: () => call(wrapInBlockquoteCommand.key),
  },
])

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

let inputed = false

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
      inputed = true
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

watchOnce(() => props.content, (v) => {
  if (inputed)
    return

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
  })
})
</script>

<template>
  <div v-if="$props.editable" flex border-b px-6 py-2 space-x-2>
    <a-tooltip v-for="{ icon, tip, handler } in utils" :key="icon" placement="bottom" :title="tip">
      <div text-6 cursor-pointer :class="icon" @click="handler" />
    </a-tooltip>
  </div>
  <Milkdown flex-1 overflow-y-auto />
</template>

<style>
.milkdown {
  @apply  p-6 h-full overflow-y-auto text-4;
}
</style>

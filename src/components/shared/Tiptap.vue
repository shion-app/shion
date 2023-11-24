<script lang="ts" setup>
import type { ChainedCommands } from '@tiptap/vue-3'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { uploadFile } from '@/modules/upload'

interface ImageNode {
  src: string
  alt: string
  title: string
}

const props = withDefaults(defineProps<{
  content: string
  editable?: boolean
}>(), {
  editable: true,
})

const { content: contentVModel } = useVModels(props)
const { t } = useI18n()

const editor = useEditor({
  content: contentVModel.value,
  editable: props.editable,
  extensions: [
    StarterKit,
    Image,
  ],
  editorProps: {
    attributes: {
      class: 'prose outline-none min-h-full',
    },
    handleDrop: (view, event, slice, moved) => {
      const hasFile = Number(event.dataTransfer?.files.length) > 0
      if (moved || !hasFile)
        return

      Promise.all([...event.dataTransfer!.files].filter(i => i.type.includes('image')).map((file) => {
        return new Promise<ImageNode>((resolve) => {
          uploadFile(file).then(src =>
            resolve({
              src,
              alt: file.name,
              title: file.name,
            }))
        })
      })).then((files) => {
        editor.value?.commands.insertContent(files.map(attrs => ({
          type: 'image',
          attrs,
        })))
      })

      event.preventDefault()
    },
  },
  onUpdate: () => {
    contentVModel.value = editor.value!.getHTML()
  },
})

const utils = computed(() => [
  {
    icon: 'i-mdi:undo',
    tip: t('moment.editor.uodo'),
    handler: call(c => c.undo()),
    disabled: !editor.value?.can().undo(),
  },
  {
    icon: 'i-mdi:redo',
    tip: t('moment.editor.redo'),
    handler: call(c => c.redo()),
    disabled: !editor.value?.can().redo(),
  },
  {
    icon: 'i-mdi:format-bold',
    tip: t('moment.editor.bold'),
    handler: call(c => c.toggleBold()),
  },
  {
    icon: 'i-mdi:format-italic',
    tip: t('moment.editor.italic'),
    handler: call(c => c.toggleItalic()),
  },
  {
    icon: 'i-mdi:format-list-bulleted',
    tip: t('moment.editor.listBulleted'),
    handler: call(c => c.toggleBulletList()),
  },
  {
    icon: 'i-mdi:format-list-numbered',
    tip: t('moment.editor.listNumbered'),
    handler: call(c => c.toggleOrderedList()),
  },
  {
    icon: 'i-mdi:format-quote-close',
    tip: t('moment.editor.quote'),
    handler: call(c => c.toggleBlockquote()),
  },
])

function call(command: (chain: ChainedCommands) => ChainedCommands) {
  if (!editor.value)
    return () => {}

  const chain = editor.value.chain()
  return () => command(chain).run()
}

watchOnce(contentVModel, (v) => {
  editor.value?.commands.setContent(v, false)
})
</script>

<template>
  <div v-if="$props.editable" flex px-4>
    <tooltip-button
      v-for="{ icon, tip, handler, disabled } in utils"
      :key="icon"
      :text="tip"
      :icon="icon"
      :disabled="disabled"
      size="small"
      @click="handler"
    />
  </div>
  <v-divider mx-4 my-2 />
  <EditorContent :editor="editor" h-full overflow-y-auto p-4 />
</template>

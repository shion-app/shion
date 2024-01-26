<script lang="ts" setup>
import type { ChainedCommands } from '@tiptap/vue-3'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { open } from '@tauri-apps/plugin-dialog'

import { uploadByPath, uploadExtension } from '@/modules/upload'
import { Video } from '@/plugins/tiptap-video'

interface DialogFilter {
  name: string
  extensions: string[]
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
    Video,
    Placeholder.configure({
      placeholder: t('tiptap.placeholder'),
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-slate outline-none min-h-full mx-auto',
    },
  },
  onUpdate: () => {
    contentVModel.value = editor.value!.getHTML()
  },
})

async function openFileDialog(filter: DialogFilter) {
  const selected = await open({
    multiple: true,
    filters: [
      filter,
    ],
  })
  if (selected?.length)
    return await Promise.all(selected.map(({ path }) => uploadByPath(path)))
  return []
}

async function uploadImage() {
  const files = await openFileDialog({
    name: t('moment.editor.image'),
    extensions: uploadExtension.image,
  })
  if (!files.length)
    return

  editor.value?.commands.insertContent(files.map(src => ({
    type: 'image',
    attrs: {
      src,
    },
  })))
}

async function uploadVideo() {
  const files = await openFileDialog({
    name: t('moment.editor.video'),
    extensions: uploadExtension.video,
  })
  if (!files.length)
    return

  editor.value?.commands.insertContent(files.map(src => ({
    type: 'video',
    attrs: {
      src,
    },
  })))
}

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
  {
    icon: 'i-mdi:image',
    tip: t('moment.editor.image'),
    handler: uploadImage,
  },
  {
    icon: 'i-mdi:video',
    tip: t('moment.editor.video'),
    handler: uploadVideo,
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
      :tooltip="tip"
      location="bottom"
      :icon="icon"
      :disabled="disabled"
      size="small"
      variant="text"
      @click="handler"
    />
  </div>
  <v-divider mx-4 my-2 />
  <EditorContent :editor="editor" h-full overflow-y-auto p-4 />
</template>

<style>
.tiptap p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>

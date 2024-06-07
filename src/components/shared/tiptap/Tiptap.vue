<script lang="ts" setup>
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import * as lowlight from 'lowlight'
import mitt from 'mitt'
import { TauriEvent } from '@tauri-apps/api/event'
import { extname } from '@tauri-apps/api/path'

import { getType, insert } from './util'
import { ImageBlock, Link, Video } from '@/extensions/tiptap/'
import { check, uploadByPath } from '@/modules/upload'

const props = defineProps<{
  content: string
  editable: boolean
  contentClass?: string
}>()

const { content: contentVModel } = useVModels(props)
const { t } = useI18n()
const { warning } = useNotify()

const previewEmitter = mitt<{
  preview: {
    src: string
  }
}>()

const editor = useEditor({
  content: contentVModel.value,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      codeBlock: false,
    }),
    Video.configure({
      emitter: previewEmitter,
    }),
    Placeholder.configure({
      placeholder: t('tiptap.placeholder'),
    }),
    Underline,
    CodeBlockLowlight.configure({
      lowlight: lowlight.lowlight,
      defaultLanguage: null,
    }),
    Link.configure({
      openOnClick: false,
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    ImageBlock.configure({
      emitter: previewEmitter,
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

useTauriListen<{
  paths: string[]
}>(TauriEvent.DROP, async (e) => {
  if (!props.editable)
    return

  if (!editor.value)
    return

  const { paths } = e.payload
  for (const path of paths) {
    const ext = await extname(path)
    if (!check(ext)) {
      return warning({
        text: t('upload.invalidType', {
          name: ext,
        }),
      })
    }
  }
  const list = await Promise.all(paths.map(async (path) => {
    const src = await uploadByPath(path)
    const ext = await extname(path)
    return {
      src,
      type: getType(ext)!,
    }
  }))
  insert(editor.value, list)
})

const tiptapWrapper = ref<HTMLElement>()
const previewUrl = ref('')
const previewIndex = ref(0)
const isPreview = computed({
  set: (v) => {
    if (!v)
      previewUrl.value = ''
  },
  get: () => !!previewUrl.value,
})
const resources = computed(() => {
  const data = editor.value?.getJSON()
  return (data?.content || []).filter(i => i.type == 'imageBlock' || i.type == 'video').map(i => ({
    type: i.type! as ('imageBlock' | 'video'),
    src: i.attrs!.src as string,
  }))
})

previewEmitter.on('preview', ({ src }) => {
  previewUrl.value = src
  previewIndex.value = resources.value.findIndex(i => i.src == src)
})

watchOnce(contentVModel, (v) => {
  editor.value?.commands.setContent(v, false)
})
</script>

<template>
  <div v-if="editor" ref="tiptapWrapper">
    <Toolbar v-if="props.editable" :editor="editor" />
    <v-divider my />
    <EditorContent :editor="editor" overflow-y-auto :class="contentClass" />
    <link-menu v-if="props.editable" :editor="editor" :append-to="tiptapWrapper" />
    <image-block-menu v-if="props.editable" :editor="editor" :append-to="tiptapWrapper" />
  </div>
  <advanced-dialog v-model:visible="isPreview" class="w-[1100px]!">
    <v-card-text>
      <v-window v-model="previewIndex" show-arrows class="h-[550px]">
        <v-window-item v-for="{ type, src } in resources" :key="src" h-full>
          <v-img v-if="type == 'imageBlock'" :src="src" :aspect-ratio="16 / 9" />
          <video
            v-else-if="type == 'video'" :src="src" h-full m-auto controls
            controlsList="nofullscreen nodownload"
          />
        </v-window-item>
      </v-window>
    </v-card-text>
  </advanced-dialog>
</template>

<style lang="scss">
.tiptap {
  padding-top: 16px;
  & > *:first-child {
    margin-top: 0;
  }
  p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
}
</style>

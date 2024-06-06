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

import { ImageBlock, Link, Video } from '@/extensions/tiptap/'

const props = defineProps<{
  content: string
  editable: boolean
  contentClass?: string
}>()

const { content: contentVModel } = useVModels(props)
const { t } = useI18n()

const tiptapWrapper = ref<HTMLElement>()
const resources = computed(() => findResources(props.content))

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
    Video,
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

const previewUrl = ref('')
const preview = computed({
  set: (v) => {
    if (!v)
      previewUrl.value = ''
  },
  get: () => !!previewUrl.value,
})
const previewIndex = ref(0)

previewEmitter.on('preview', ({ src }) => {
  previewUrl.value = src
  previewIndex.value = resources.value.indexOf(src)
})

function findResources(str: string) {
  const match = str.match(/<img[^>]+>/g)
  const images = match
    ? match.map(image => image.match(/src="([^"]*)"/)?.[1] || '')
    : []

  return images
}

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
  <advanced-dialog v-model:visible="preview" class="w-[1000px]!">
    <v-card-text>
      <v-window v-model="previewIndex" show-arrows class="h-[500px]">
        <v-window-item v-for="src in resources" :key="src" class="h-full">
          <!-- <v-responsive :aspect-ratio="16 / 9">
            <img :src="src">
          </v-responsive> -->
          <v-img :src="src" :aspect-ratio="16 / 9" />
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

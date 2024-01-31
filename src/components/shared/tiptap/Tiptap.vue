<script lang="ts" setup>
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import * as lowlight from 'lowlight'

import { ImageBlock, Link, Video } from '@/extensions/tiptap/'

const props = defineProps<{
  content: string
  editable: boolean
  contentClass?: string
}>()

const { content: contentVModel } = useVModels(props)
const { t } = useI18n()

const tiptapWrapper = ref<HTMLElement>()

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
    ImageBlock,
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

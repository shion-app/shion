<script lang="ts" setup>
import type { ChainedCommands } from '@tiptap/vue-3'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

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
  ],
  editorProps: {
    attributes: {
      class: 'prose outline-none min-h-full',
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
  },
  {
    icon: 'i-mdi:redo',
    tip: t('moment.editor.redo'),
    handler: call(c => c.redo()),
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

watch(contentVModel, (v) => {
  editor.value?.commands.setContent(v, false)
})
</script>

<template>
  <div v-if="$props.editable" flex px-4>
    <tooltip-button v-for="{ icon, tip, handler } in utils" :key="icon" :text="tip" :icon="icon" size="small" @click="handler" />
  </div>
  <v-divider mx-4 my-2 />
  <EditorContent :editor="editor" h-full overflow-y-auto p-4 />
</template>

<script setup lang="ts">
import { BubbleMenu } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/vue-3'

const props = defineProps<{
  editor: Editor
  appendTo?: HTMLElement
}>()

const showEdit = ref(false)
const link = ref('')
const target = ref('')

const shouldShow = () => props.editor.isActive('link')

const handleEdit = () => {
  showEdit.value = true
}

const onSetLink = (url: string) => {
  props.editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run()
  showEdit.value = false
}

const onUnsetLink = () => {
  props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
  showEdit.value = false
}

whenever(shouldShow, () => {
  link.value = props.editor.getAttributes('link').href || ''
  target.value = props.editor.getAttributes('link').target || ''
})
</script>

<template>
  <BubbleMenu
    :editor="props.editor"
    plugin-key="linkMenu"
    :should-show="shouldShow"
    :tippy-options="{
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      onHidden: async () => {
        showEdit = true
        await nextTick()
        showEdit = false
      },
      maxWidth: 'auto',
      appendTo: props.appendTo,
    }"
  >
    <template v-if="showEdit">
      <LinkEditorPanel :url="link" :initial-open-in-new-tab="target === '_blank'" :on-set-link="onSetLink" />
    </template>
    <template v-else>
      <LinkPreviewPanel :url="link" :on-clear="onUnsetLink" :on-edit="handleEdit" />
    </template>
  </BubbleMenu>
</template>

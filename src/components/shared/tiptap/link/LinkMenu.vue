<script setup lang="ts">
import { BubbleMenu } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/vue-3'

export interface Props {
  editor: Editor
}

const props = defineProps<Props>()

const showEdit = ref(false)
const visible = ref(false)
const link = ref('')
const target = ref('')

const shouldShow = () => {
  const isActive = props.editor.isActive('link')
  visible.value = isActive
  link.value = props.editor.getAttributes('link').href || ''
  target.value = props.editor.getAttributes('link').target || ''
  return isActive && props.editor.isEditable
}

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

const tippyOptions = reactive({
  popperOptions: {
    modifiers: [{ name: 'flip', enabled: false }],
  },
  onHidden: () => {
    showEdit.value = false
    visible.value = false
  },
})
</script>

<template>
  <BubbleMenu
    :editor="editor" plugin-key="linkMenu" :should-show="shouldShow" :update-delay="0"
    :tippy-options="tippyOptions"
  >
    <template v-if="visible">
      <template v-if="showEdit">
        <LinkEditorPanel :initial-url="link" :initial-open-in-new-tab="target === '_blank'" :on-set-link="onSetLink" />
      </template>
      <template v-else>
        <LinkPreviewPanel :url="link" :on-clear="onUnsetLink" :on-edit="handleEdit" />
      </template>
    </template>
  </BubbleMenu>
</template>

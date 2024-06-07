<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/vue-3'

interface Props {
  editor: Editor
  getPos: () => number
  node: Node & {
    attrs: {
      src: string
      align: string
      width: string
    }
  }
}

const props = defineProps<Props>()

const wrapperClassName = computed(() => {
  const { align } = props.node.attrs
  return [
    align === 'left' ? 'ml-0' : 'ml-auto',
    align === 'right' ? 'mr-0' : 'mr-auto',
    align === 'center' && 'mx-auto',
  ]
})

function handleClick() {
  props.editor.commands.setNodeSelection(props.getPos())
  props.editor.commands.previewImage(props.node.attrs.src)
}
</script>

<template>
  <NodeViewWrapper>
    <div
      :class="wrapperClassName" :style="{
        width: props.node.attrs.width,
      }"
    >
      <div :contentEditable="false">
        <img block cursor-zoom-in class="max-h-[400px]" :src="props.node.attrs.src" @click="handleClick">
      </div>
    </div>
  </NodeViewWrapper>
</template>

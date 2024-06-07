<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/vue-3'

interface Props {
  editor: Editor
  getPos: () => number
  node: Node & {
    attrs: {
      src: string
    }
  }
}

const props = defineProps<Props>()

function handleClick() {
  props.editor.commands.setNodeSelection(props.getPos())
  props.editor.commands.previewVideo(props.node.attrs.src)
}
</script>

<template>
  <NodeViewWrapper>
    <video cursor-zoom-in class="max-h-[400px]" :src="props.node.attrs.src" @click="handleClick" />
  </NodeViewWrapper>
</template>

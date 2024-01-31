<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3'
import { nanoid } from 'nanoid'

interface MenuProps {
  editor: Editor
}

const props = defineProps<MenuProps>()

const width = ref(parseInt(props.editor.getAttributes('imageBlock').width))
const button = computed(() => props.editor.isActive('imageBlock', { align: 'left' })
  ? 'left'
  : props.editor.isActive('imageBlock', { align: 'right' })
    ? 'right'
    : 'center')

const shouldShow = () => {
  return props.editor.isActive('imageBlock') && props.editor.isEditable
}

const onAlignImageLeft = () => props.editor.chain().focus(undefined, { scrollIntoView: false }).setImageBlockAlign('left').run()
const onAlignImageCenter = () => props.editor.chain().focus(undefined, { scrollIntoView: false }).setImageBlockAlign('center').run()
const onAlignImageRight = () => props.editor.chain().focus(undefined, { scrollIntoView: false }).setImageBlockAlign('right').run()

const onWidthChange = (value: number) => {
  props.editor.chain().focus(undefined, { scrollIntoView: false }).setImageBlockWidth(value).run()
}

watch(width, onWidthChange)
</script>

<template>
  <BubbleMenu
    :editor="props.editor"
    :plugin-key="`imageBlockMenu-${nanoid()}`"
    :should-show="shouldShow"
    :update-delay="0"
    :tippy-options="{
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      maxWidth: 'auto',
    }"
  >
    <v-card class="overflow-visible!">
      <div p-2 flex items-center>
        <v-btn-toggle
          color="primary"
          mandatory
          :model-value="button"
        >
          <v-btn icon="mdi-format-align-left" value="left" @click="onAlignImageLeft" />
          <v-btn icon="mdi-format-align-center" value="center" @click="onAlignImageCenter" />
          <v-btn icon="mdi-format-align-right" value="right" @click="onAlignImageRight" />
        </v-btn-toggle>
        <v-slider v-model="width" class="w-[200px] mx-6!" :min="0" :max="100" :step="1" hide-details density="comfortable" thumb-label="always" />
      </div>
    </v-card>
  </BubbleMenu>
</template>

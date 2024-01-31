<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3'

const props = defineProps<{
  editor: Editor
  appendTo?: HTMLElement
}>()

const width = ref(100)
const button = computed(() => props.editor.isActive('imageBlock', { align: 'left' })
  ? 'left'
  : props.editor.isActive('imageBlock', { align: 'right' })
    ? 'right'
    : 'center')

const shouldShow = () => props.editor.isActive('imageBlock')

const onAlignImageLeft = () => props.editor.chain().focus().setImageBlockAlign('left').run()
const onAlignImageCenter = () => props.editor.chain().focus().setImageBlockAlign('center').run()
const onAlignImageRight = () => props.editor.chain().focus().setImageBlockAlign('right').run()
const onWidthChange = (value: number) => props.editor.chain().focus().setImageBlockWidth(value).run()

whenever(shouldShow, () => width.value = parseInt(props.editor.getAttributes('imageBlock').width))

watch(width, onWidthChange)
</script>

<template>
  <BubbleMenu
    :editor="props.editor"
    plugin-key="imageBlockMenu"
    :should-show="shouldShow"
    :tippy-options="{
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      maxWidth: 'auto',
      appendTo: props.appendTo,
    }"
  >
    <v-card class="overflow-visible!">
      <div p-2 flex items-center>
        <v-btn-toggle
          color="primary"
          mandatory
          :model-value="button"
        >
          <tooltip-button location="bottom" :tooltip="$t('tiptap.image.left')" icon="mdi-format-align-left" value="left" @click="onAlignImageLeft" />
          <tooltip-button location="bottom" :tooltip="$t('tiptap.image.center')" icon="mdi-format-align-center" value="center" @click="onAlignImageCenter" />
          <tooltip-button location="bottom" :tooltip="$t('tiptap.image.right')" icon="mdi-format-align-right" value="right" @click="onAlignImageRight" />
        </v-btn-toggle>
        <v-slider v-model="width" class="w-[200px] mx-6!" :min="0" :max="100" :step="1" hide-details thumb-label="always" />
      </div>
    </v-card>
  </BubbleMenu>
</template>

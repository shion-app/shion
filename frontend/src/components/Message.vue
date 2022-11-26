<script lang="ts" setup>
import type { DialogProps, MessageOptions } from '../utils/dialog'

const { list, remove } = $(useDialogStore())

const messageList = $computed(() => (list as Array<DialogProps<MessageOptions>>).filter(dialog => dialog.type === 'message'))

const activeMessageList = $computed(() => messageList.filter(dialog => !dialog.closed))

function handleAfterLeave(el: HTMLElement) {
  const { index } = el.dataset
  const dialog: DialogProps<MessageOptions> = messageList[index!]
  if (!dialog)
    return
  dialog.resolve(dialog.ok)
  remove(dialog.id)
}
</script>

<template>
  <teleport to="body">
    <TransitionGroup name="message" tag="div" fixed top-0 left-0 right-0 pointer-events-none @after-leave="handleAfterLeave">
      <div
        v-for="dialog, index in activeMessageList"
        :key="dialog.id"
        flex
        justify-center
        w-full
      >
        <div
          :style="{
            ...pick(dialog, dimensionKey),
            zIndex: -index,
          }"
          :data-index="index"
          relative
          p-2
          border-rounded
          shadow-lg
          bg-white
          mt-4
          mx-a
        >
          {{ dialog.content }}
        </div>
      </div>
    </TransitionGroup>
  </teleport>
</template>

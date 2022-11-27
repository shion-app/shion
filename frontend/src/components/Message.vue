<script lang="ts" setup>
import { Transition } from 'vue'

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
    <TransitionGroup name="message-transition" tag="div" fixed top-0 left-0 right-0 pointer-events-none @after-leave="handleAfterLeave">
      <div
        v-for="dialog, index in activeMessageList"
        :key="dialog.id"
        :data-index="index"
        flex
        justify-center
        w-full
      >
        <div
          :style="{
            ...pick(dialog, dimensionKey),
          }"
          relative
          p-2
          border-rounded
          shadow-xl
          bg-white
          mt-4
          pointer-events-auto
          flex
          items-center
        >
          <v-fade-transition mode="out-in">
            <div
              v-if="dialog.status === 'success'"
              i-mdi:check-circle
              c-green
              text-6
            />
            <v-progress-circular
              v-else-if="dialog.status === 'loading'"
              color="info"
              indeterminate
              size="24"
              width="3"
            />
          </v-fade-transition>
          <div mx-2>
            {{ dialog.content }}
          </div>
        </div>
      </div>
    </TransitionGroup>
  </teleport>
</template>

<script lang="ts" setup>
import type { DialogProps, MessageOptions } from '../utils/dialog'

const { list } = $(useDialogStore())

const messageList = $computed(() => (list as Array<DialogProps<MessageOptions>>).filter(dialog => dialog.type === 'message'))
</script>

<template>
  <teleport to="body">
    <TransitionGroup name="message-transition" tag="div" fixed top-0 left-0 right-0 pointer-events-none>
      <div
        v-for="dialog, index in messageList"
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
          mt-6
          pointer-events-auto
          flex
          items-center
          class="elevation-8"
        >
          <v-fade-transition mode="out-in">
            <div v-if="dialog.status === 'success'" flex>
              <div

                i-mdi:check-circle
                c-green
                text-6
              />
              <div mx-2>
                {{ dialog.successText }}
              </div>
            </div>
            <div v-else-if="dialog.status === 'loading'" flex>
              <v-progress-circular

                color="info"
                indeterminate
                size="24"
                width="3"
              />
              <div mx-2>
                {{ dialog.loadingText }}
              </div>
            </div>
          </v-fade-transition>
        </div>
      </div>
    </TransitionGroup>
  </teleport>
</template>

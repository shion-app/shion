<script lang="ts" setup>
import { Transition } from 'vue'

import type { ConfirmOptions, DialogProps } from '../utils/dialog'

const { list, remove } = $(useDialogStore())

const confirmList = $computed(() => (list as Array<DialogProps<ConfirmOptions>>).filter(dialog => dialog.type === 'confirm'))

const DialogTransition = defineComponent({
  name: 'DialogTransition',
  props: ['handleAfterLeave'],
  setup(props, { slots }) {
    return () => h(Transition, {
      name: 'dialog-transition',
      onAfterLeave() {
        props.handleAfterLeave()
      },
    }, slots)
  },
})

function handleAfterLeave(dialog: DialogProps) {
  dialog.resolve(dialog.ok)
  remove(dialog.id)
}

function confirm(dialog: DialogProps) {
  close(dialog)
}
function cancel(dialog: DialogProps) {
  dialog.ok = false
  close(dialog)
}

function close(dialog: DialogProps) {
  dialog.modelValue = false
}
</script>

<template>
  <v-dialog
    v-for="dialog in confirmList"
    :key="dialog.id" v-model="dialog.modelValue" :transition="{
      // @ts-ignore
      component: DialogTransition,
      handleAfterLeave() {
        handleAfterLeave(dialog)
      },
    }"
    v-bind="pick(dialog, dimensionKey)"
  >
    <v-card>
      <v-card-title v-if="dialog.title">
        {{ dialog.title }}
      </v-card-title>
      <v-card-text>
        {{ dialog.content }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" text @click="confirm(dialog)">
          {{ $t("dialog.confirm") }}
        </v-btn>
        <v-btn color="error" text @click="cancel(dialog)">
          {{ $t("dialog.cancel") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script setup lang="ts">
import { useMotions } from '@vueuse/motion'

const props = withDefaults(defineProps<{
  visible: boolean
  title: string
  page?: boolean
}>(), {
  page: false,
})

const { visible: visibleVModel } = useVModels(props)

const { width: deviceWidth } = useWindowSize()
const motions = useMotions()
const { xs } = useTailwindBreakpoints()

const dragHandler = ({ movement: [x], dragging }) => {
  if (!xs)
    return

  if (!motions.dialog)
    return

  const close = x > deviceWidth.value / 2
  if (!dragging) {
    if (close) {
      visibleVModel.value = false
    }
    else {
      motions.dialog.apply({
        x: 0,
      })
    }
    return
  }

  motions.dialog.apply({
    x,
  })
}
</script>

<template>
  <v-dialog
    v-model="visibleVModel"
    v-bind="{
      width: props.page ? '' : 400,
      fullscreen: props.page,
      scrim: !props.page,
    }"
    :transition="page ? 'dialog-slide-transition' : 'dialog-transition'"
  >
    <v-card v-drag="dragHandler" v-motion="'dialog'">
      <v-toolbar v-if="props.page" class="bg-transparent!">
        <v-btn icon="mdi-arrow-left" @click="visibleVModel = false" />
        <v-toolbar-title>{{ props.title }}</v-toolbar-title>
      </v-toolbar>
      <v-card-title v-if="!props.page">
        {{ props.title }}
      </v-card-title>
      <slot />
    </v-card>
  </v-dialog>
</template>

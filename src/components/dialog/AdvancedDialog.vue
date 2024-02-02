<script setup lang="ts">
import { useMotions } from '@vueuse/motion'

const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  page?: boolean
}>(), {
  page: false,
})

const { visible: visibleVModel } = useVModels(props)

const { width: deviceWidth } = useWindowSize()
const motions = useMotions()
const { xs } = useTailwindBreakpoints()
const { toggleDialog } = useDialogStore()

const dragHandler = ({ movement: [x], dragging }) => {
  if (!xs.value)
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

watch(visibleVModel, v => toggleDialog(v))

onUnmounted(() => {
  toggleDialog(false)
})
</script>

<template>
  <v-dialog
    v-model="visibleVModel"
    v-bind="{
      fullscreen: props.page,
      scrim: !props.page,
    }"
    :transition="page ? 'dialog-slide-transition' : 'dialog-transition'"
    class="sm:w-[600px]" :class="[props.page ? 'w-screen' : 'w-[90vw]']"
  >
    <v-card v-drag="dragHandler" v-motion="'dialog'">
      <v-toolbar v-if="props.page" class="bg-transparent!">
        <v-btn icon="mdi-arrow-left" @click="visibleVModel = false" />
        <v-toolbar-title>{{ props.title }}</v-toolbar-title>
      </v-toolbar>
      <v-card-title v-if="!props.page && props.title">
        {{ props.title }}
      </v-card-title>
      <slot />
    </v-card>
  </v-dialog>
</template>

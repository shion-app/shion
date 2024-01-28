<script setup lang="ts">
import { nanoid } from 'nanoid'

import { emitter } from '@/plugins/mitt'

const props = withDefaults(defineProps<{
  visible?: boolean
}>(), {
  visible: true,
})

const id = nanoid()

function show(show: boolean) {
  emitter.emit('toggle-more-menu', {
    id,
    show,
  })
}

show(true)

onUnmounted(() => {
  show(false)
})

watch(() => props.visible, show)
</script>

<template>
  <v-menu activator="#more-menu" location="right" offset="20" min-width="150">
    <slot />
  </v-menu>
</template>

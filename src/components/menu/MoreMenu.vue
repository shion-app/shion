<script setup lang="ts">
import { nanoid } from 'nanoid'

import { emitter } from '@/plugins/mitt'

const id = nanoid()

emitter.emit('toggle-more-menu', {
  id,
  show: true,
})

onUnmounted(() => {
  emitter.emit('toggle-more-menu', {
    id,
    show: false,
  })
})
</script>

<template>
  <v-menu activator="#more-menu" location="right" offset="20" min-width="150">
    <slot />
  </v-menu>
</template>

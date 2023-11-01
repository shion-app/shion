<script setup lang="ts">
import { emitter } from '@/plugins/mitt'

emitter.emit('toggle-more-menu', true)

onUnmounted(() => {
  emitter.emit('toggle-more-menu', false)
})
</script>

<template>
  <v-menu activator="#more-menu" location="right" offset="20" min-width="150">
    <slot />
  </v-menu>
</template>

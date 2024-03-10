<script setup lang="ts">
import { emitter } from '@/plugins/mitt'

const moreMenu = ref({
  id: '',
  show: false,
})

emitter.on('toggle-more-menu', (v) => {
  if (v.show || moreMenu.value.id == v.id)
    moreMenu.value = v
})
</script>

<template>
  <v-btn
    id="more-menu" icon variant="elevated"
    :class="{
      invisible: !moreMenu.show,
    }"
  >
    <div i-mdi:menu text-6 />
  </v-btn>
</template>

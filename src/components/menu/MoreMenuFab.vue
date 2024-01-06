<script setup lang="ts">
import { layoutMainInject } from '../layout/provide'

const { dragged, toggleDrag } = layoutMainInject()
</script>

<template>
  <div class="fixed bottom-24 right-6">
    <v-btn
      v-show="dragged"
      icon variant="elevated" size="large"
      @click="() => toggleDrag()"
    >
      <div i-mdi:stop text-6 />
    </v-btn>
    <more-menu-button v-show="!dragged" variant="elevated" size="large" />
  </div>
</template>

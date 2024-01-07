<script setup lang="ts">
import { layoutMainInject } from '../layout/provide'

const { dragged, toggleDrag } = layoutMainInject()
</script>

<template>
  <div flex>
    <div flex-1 />
    <v-btn
      v-show="dragged"
      icon variant="elevated"
      @click="() => toggleDrag()"
    >
      <div i-mdi:stop text-6 />
    </v-btn>
    <more-menu-button v-show="!dragged" variant="elevated" size="default" />
  </div>
</template>

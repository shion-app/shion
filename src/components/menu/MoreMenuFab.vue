<script setup lang="ts">
const { dragged, toggleDrag } = layoutInject()
</script>

<template>
  <div flex>
    <div flex-1 />
    <v-btn
      v-show="dragged"
      icon variant="elevated"
      @click="() => toggleDrag()"
    >
      <div i-mdi:lock-outline text-6 />
    </v-btn>
    <more-menu-button v-show="!dragged" variant="elevated" size="default" />
  </div>
</template>

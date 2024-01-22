<script setup lang="ts">
const { railWidth, footerHeight, headerHeight } = layoutInject()
</script>

<template>
  <main
    absolute right-0 overflow-y-auto overflow-x-hidden
    :style="{
      left: `${railWidth}px`,
      top: `${headerHeight}px`,
      bottom: `${footerHeight}px`,
    }"
  >
    <slot />
  </main>
</template>

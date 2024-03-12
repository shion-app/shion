<script setup lang="ts">
const { footerHeight } = layoutInject()
</script>

<template>
  <footer
    id="footer"
    absolute bottom-0 left-0 right-0
    :style="{
      height: `${footerHeight}px`,
    }"
  >
    <slot />
  </footer>
</template>

<script setup lang="ts">
const { railWidth, footerHeight, headerHeight } = layoutInject()
</script>

<template>
  <nav
    absolute
    left-0
    :style="{
      top: `${headerHeight}px`,
      width: `${railWidth}px`,
      bottom: `${footerHeight}px`,
    }"
  >
    <slot />
  </nav>
</template>

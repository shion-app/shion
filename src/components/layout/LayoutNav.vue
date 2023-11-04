<script setup lang="ts">
import { layoutSymbol } from './provide'

const { railWidth, footerHeight, headerHeight } = inject(layoutSymbol)!
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

<script setup lang="ts">
import { layoutSymbol } from './provide'

provide(layoutSymbol, {
  headerHeight: 36,
  footerHeight: 30,
  railWidth: 100,
})
</script>

<template>
  <div h-screen relative>
    <slot />
  </div>
</template>

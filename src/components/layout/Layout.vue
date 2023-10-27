<script setup lang="ts">
import { layoutSymbol } from './provide'

provide(layoutSymbol, {
  footerHeight: 30,
  railWidth: 100,
})
</script>

<template>
  <div h-screen relative>
    <slot />
  </div>
</template>
./provide

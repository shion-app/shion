<script setup lang="ts">
const { railWidth, footerHeight, headerHeight } = layoutInject()

const el = ref()
const { bottom } = useElementBounding(el)
const { y } = useMouse()

layoutMainProvide({
  bottom,
  mouseY: y,
})
</script>

<template>
  <main
    ref="el"
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

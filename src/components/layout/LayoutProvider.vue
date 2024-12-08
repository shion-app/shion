<script setup lang="ts">
const { sm } = useTailwindBreakpoints()

const dragged = ref(false)
const isGrid = ref(false)
const toggleDrag = useToggle(dragged)
const toggleIsGrid = useToggle(isGrid)

const el = ref()

const { bottom } = useElementBounding(el)
const { y } = useMouse()

layoutProvide({
  headerHeight: sm.value ? 36 : 48,
  footerHeight: sm.value ? 24 : 54,
  railWidth: sm.value ? 100 : 0,
  dragged,
  toggleDrag,
  isGrid,
  toggleIsGrid,
  bottom,
  mouseY: y,
})
</script>

<template>
  <div ref="el" h-screen relative>
    <slot />
  </div>
</template>

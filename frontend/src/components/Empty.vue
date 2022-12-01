<script lang="ts" setup>
let active = $ref(false)

nextTick(() => active = true)
</script>

<template>
  <div h-full flex justify-center items-center class="empty">
    <v-fade-transition origin="center">
      <div v-show="active" h-full class="scale-[70%]">
        <slot />
      </div>
    </v-fade-transition>
  </div>
</template>

<style lang="scss">
.empty img {
  height: 100%;
}
</style>

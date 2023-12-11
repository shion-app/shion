<script setup lang="ts">
const props = defineProps<{
  title?: string
  selected: boolean
}>()

defineOptions({
  inheritAttrs: false,
})

const { selected: selectedVModel } = useVModels(props)
</script>

<template>
  <v-hover>
    <template #default="{ isHovering, props: hoverProps }">
      <v-card v-bind="hoverProps" :title="$props.title" hover flex-1 relative>
        <template #prepend?>
          <slot name="prepend" />
        </template>
        <template #append>
          <div v-if="selectedVModel || isHovering" @click.stop>
            <v-checkbox v-model="selectedVModel" hide-details density="comfortable" />
          </div>
          <slot v-else name="append" />
        </template>
        <slot />
        <div absolute right-4.5 bottom-4 :class="isHovering ? 'opacity-100' : 'opacity-0'" transition-opacity-400>
          <v-menu min-width="150" open-on-hover>
            <template #activator="{ props: menuProps }">
              <v-btn icon v-bind="menuProps" size="x-small">
                <div i-mdi:menu-down text-6 />
              </v-btn>
            </template>
            <v-list>
              <slot name="menu" />
            </v-list>
          </v-menu>
        </div>
      </v-card>
    </template>
  </v-hover>
</template>

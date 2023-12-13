<script setup lang="ts">
const props = defineProps<{
  title?: string
  subtitle?: string
  selected: boolean
}>()

defineEmits(['update:selected'])

const { selected: selectedVModel } = useVModels(props)
</script>

<template>
  <v-hover>
    <template #default="{ isHovering, props: hoverProps }">
      <v-card
        v-bind="{
          ...hoverProps,
          ...$attrs,
        }" :title="$props.title" :subtitle="$props.subtitle" hover flex-1 relative
      >
        <template #prepend?>
          <slot name="prepend" />
        </template>
        <template v-if="$slots.append" #append>
          <slot name="append" />
        </template>
        <slot />
        <div
          :class="selectedVModel || isHovering ? 'opacity-100' : 'opacity-0'"
          transition-opacity-400
          absolute top-0 right-2 bg-white
        >
          <v-checkbox
            v-model="selectedVModel"
            hide-details
            density="comfortable"
            @click.stop
          />
        </div>
        <div
          v-if="$slots.menu"
          :class="isHovering ? 'opacity-100' : 'opacity-0'"
          transition-opacity-400
          absolute bottom-2 right-2.5 bg-white
        >
          <v-menu
            open-on-hover
          >
            <template #activator="{ props: menuProps }">
              <v-btn icon v-bind="menuProps" size="x-small">
                <div i-mdi:menu-down text-6 />
              </v-btn>
            </template>
            <v-list min-width="100">
              <slot name="menu" />
            </v-list>
          </v-menu>
        </div>
      </v-card>
    </template>
  </v-hover>
</template>
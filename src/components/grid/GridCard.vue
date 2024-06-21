<script setup lang="ts">
import { vOnLongPress } from '@vueuse/components'

const props = defineProps<{
  title?: string
  subtitle?: string
  selected: boolean
}>()

defineEmits(['update:selected'])

defineOptions({
  inheritAttrs: false,
})

const { selected: selectedVModel } = useVModels(props)
const { toggleDrag, dragged } = layoutInject()

const mobileMenuVisible = ref(false)

function handleLongpress() {
  mobileMenuVisible.value = true
}
</script>

<template>
  <v-hover>
    <template #default="{ isHovering, props: hoverProps }">
      <v-card
        v-on-long-press="[handleLongpress, { delay: 400 }]" v-bind="{
          ...hoverProps,
          ...$attrs,
        }" :title="$props.title" :subtitle="$props.subtitle" hover flex-1
        relative
        :class="{
          'vibrate-1': dragged,
        }"
      >
        <template v-if="$slots.prepend" #prepend>
          <slot name="prepend" />
        </template>
        <template v-if="$slots.append" #append>
          <slot name="append" />
        </template>
        <slot />
        <div
          v-if="isDesktop && !dragged"
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
          v-if="isDesktop && !dragged && $slots.menu"
          :class="isHovering ? 'opacity-100' : 'opacity-0'"
          transition-opacity-400
          absolute bottom-2 right-2.5 bg-white
        >
          <v-menu>
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
        <v-menu v-if="isMobile && $slots.menu" v-model="mobileMenuVisible" scrim target="parent" offset="10">
          <v-list min-width="100">
            <slot name="menu" />
            <v-list-item v-if="!dragged" value="girdCard.move" :title="$t('gridCard.move')" append-icon="mdi-cursor-move" @click="() => toggleDrag(true)" />
          </v-list>
        </v-menu>
      </v-card>
    </template>
  </v-hover>
</template>

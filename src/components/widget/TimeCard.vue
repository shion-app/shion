<script setup lang="ts">
defineProps<{
  id: number
  title: string
  totalTime: number
  color: string
  prependImgUrl?: string
}>()

defineEmits<{
  (e: 'update', id: number): void
  (e: 'remove', id: number): void
}>()

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <v-hover>
    <template #default="{ isHovering, props }">
      <v-card
        v-bind="props"
        :title="$props.title"
        hover
      >
        <template v-if="$props.prependImgUrl" #prepend>
          <img :src="$props.prependImgUrl" width="32" height="32">
        </template>
        <template #append>
          <div
            w-3 h-3 rounded-full m-3.5
            :style="{
              backgroundColor: color,
            }"
          />
        </template>
        <v-card-text flex items-center justify-between>
          <div>
            {{ formatHHmmss($props.totalTime) }}
          </div>
          <div :class="isHovering ? 'opacity-100' : 'opacity-0'" transition-opacity-400>
            <v-menu min-width="150" open-on-hover>
              <template #activator="{ props: menuProps }">
                <v-btn icon variant="text" v-bind="menuProps" size="small">
                  <div i-mdi:menu-down text-6 />
                </v-btn>
              </template>
              <v-list>
                <v-list-item value="update" @click="$emit('update', $props.id)">
                  <v-list-item-title>{{ $t('button.update') }}</v-list-item-title>
                </v-list-item>
                <v-list-item value="remove" @click="$emit('remove', $props.id)">
                  <v-list-item-title>{{ $t('button.remove') }}</v-list-item-title>
                </v-list-item>
                <slot name="menu" />
              </v-list>
            </v-menu>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </v-hover>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  id: number
  title: string
  selected: boolean
  itemCount: number
  color: string
  actions?: string[]
}>(), {
  actions: () => ['remove', 'update'],
})

defineEmits<{
  (e: 'update', id: number): void
  (e: 'remove', id: number): void
  (e: 'update:selected', v: boolean): void
}>()

const { selected: selectedVModel } = useVModels(props)
const slots = useSlots()

const hasMenu = computed(() => !!props.actions.length || !!slots.menu)
</script>

<template>
  <grid-card v-model:selected="selectedVModel" :title="props.title">
    <template #append>
      <div
        w-3 h-3 rounded-full mr-1 :style="{
          backgroundColor: color,
        }"
      />
    </template>
    <template v-if="hasMenu" #menu>
      <v-list-item
        v-if="props.actions.includes('remove')" value="button.remove" :title="$t('button.remove')"
        append-icon="mdi-trash-can-outline" base-color="red" @click="$emit('remove', $props.id)"
      />
      <v-list-item
        v-if="props.actions.includes('update')" value="button.update" :title="$t('button.update')"
        append-icon="mdi-pencil-outline" @click="$emit('update', $props.id)"
      />
      <slot name="menu" />
    </template>
    <v-card-text class="pb-0! pt-2!">
      <div>
        {{ $t('box.count', {
          count: $props.itemCount,
        }) }}
      </div>
    </v-card-text>
  </grid-card>
</template>

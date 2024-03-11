<script setup lang="ts">
import { useLocale } from 'vuetify/lib/framework.mjs'

import type { NestedMenuItem, NestedMenuItemValue } from '@/interfaces'

const props = withDefaults(defineProps<{
  modelValue: Array<NestedMenuItemValue>
  items: Array<NestedMenuItem>
  prefix?: Array<NestedMenuItemValue>
}>(), {
  prefix: () => [],
})

defineEmits(['update:modelValue'])

const { modelValue } = useVModels(props)
const { t } = useLocale()

const isRoot = computed(() => props.prefix.length == 0)
const location = computed(() => isRoot.value ? 'bottom' : 'right')
// const menuActive = computed(() => modelValue.value.length > 0 && props.prefix.every((v, i) => v == modelValue.value[i]))

function select(value: NestedMenuItemValue) {
  modelValue.value = [...props.prefix, value]
}

function menuItemActive(value: NestedMenuItemValue) {
  return [...props.prefix, value].every((v, i) => v == modelValue.value[i])
}
</script>

<template>
  <v-menu :location="location" min-width="100">
    <v-list max-height="200">
      <template v-if="props.items.length">
        <template v-for="{ title, value, children } in props.items" :key="value">
          <v-list-item
            v-if="children" :title="title" :value="value" append-icon="mdi-chevron-right"
            :active="menuItemActive(value)"
          >
            <nested-menu v-model="modelValue" :items="children" :prefix="[...props.prefix, value]" activator="parent" />
          </v-list-item>
          <v-list-item v-else :title="title" :value="value" :active="menuItemActive(value)" @click="select(value)" />
        </template>
      </template>
      <v-list-item v-else :title="t('$vuetify.noDataText')" />
    </v-list>
  </v-menu>
</template>

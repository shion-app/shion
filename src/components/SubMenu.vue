<script setup lang="ts">
import type { Menu } from '../interfaces/'

defineProps<{
  menu: Menu
}>()
</script>

<template>
  <a-sub-menu :key="menu.key">
    <template v-if="menu.icon" #icon>
      <div :class="menu.icon" />
    </template>
    <template v-if="menu.children?.length" #title>
      {{ menu.title }}
    </template>
    <template v-for="item in menu.children" :key="item.key">
      <template v-if="!item.children">
        <a-menu-item :key="item.key">
          {{ item.title }}
        </a-menu-item>
      </template>
      <template v-else>
        <sub-menu :key="item.key" :menu="item" />
      </template>
    </template>
  </a-sub-menu>
</template>

<script setup lang="ts">
const { xs, sm } = useTailwindBreakpoints()
</script>

<template>
  <layout-provider>
    <layout-header>
      <title-bar />
    </layout-header>
    <layout-nav v-if="sm">
      <nav-action />
    </layout-nav>
    <layout-main>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </layout-main>
    <layout-footer>
      <nav-action v-if="xs" />
      <status-bar v-else />
    </layout-footer>
  </layout-provider>
</template>

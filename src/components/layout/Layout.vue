<script setup lang="ts">
const { xs, sm } = useTailwindBreakpoints()
</script>

<template>
  <layout-provider>
    <layout-header>
      <title-bar />
    </layout-header>
    <layout-nav v-if="sm">
      <nav-action nav-text vertical>
        <more-menu-button v-if="isDesktop" />
      </nav-action>
    </layout-nav>
    <layout-main>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
      <div v-if="isMobile" fixed bottom-24 left-0 right-0 mx-4 flex items-center>
        <timer-float />
        <div flex-1 />
        <more-menu-fab />
      </div>
    </layout-main>
    <layout-footer>
      <nav-action v-if="xs" />
      <status-bar v-else />
    </layout-footer>
  </layout-provider>
</template>

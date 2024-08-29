<script setup lang="ts">
const configStore = useConfigStore()

const { ready } = storeToRefs(configStore)
</script>

<template>
  <layout-provider>
    <layout-header>
      <title-bar />
    </layout-header>
    <layout-nav>
      <nav-action nav-text vertical>
        <more-menu-button />
      </nav-action>
    </layout-nav>
    <layout-main>
      <router-view v-slot="{ Component }">
        <component :is="Component" v-if="ready" />
      </router-view>
    </layout-main>
    <layout-footer>
      <status-bar />
    </layout-footer>
  </layout-provider>
</template>

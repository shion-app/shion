<template>
  <layout-provider>
    <layout-header>
      <title-bar />
    </layout-header>
    <layout-nav>
      <nav-action />
    </layout-nav>
    <layout-main>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </layout-main>
    <layout-footer>
      <status-bar />
    </layout-footer>
  </layout-provider>
</template>

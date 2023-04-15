<template>
  <nav-drawer>
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </nav-drawer>
</template>

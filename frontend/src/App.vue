<template>
  <nav-drawer>
    <router-view v-slot="{ Component }">
      <keep-alive :include="['clock']">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </nav-drawer>
  <dialog-provider />
</template>

<style>
html, body, #app {
  height: 100%;
}
html {
  overflow: hidden;
}
</style>

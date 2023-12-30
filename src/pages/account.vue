<script setup lang="ts">
const setting = ref(false)
const about = ref(false)
</script>

<template>
  <div>
    <v-list>
      <v-list-item value="titleBar.view.setting" :title="$t('titleBar.view.setting')" prepend-icon="mdi-cog" append-icon="mdi-chevron-right" @click="setting = true" />
      <v-list-item value="titleBar.help.about" :title="$t('titleBar.help.about')" prepend-icon="mdi-information" append-icon="mdi-chevron-right" @click="about = true" />
    </v-list>
  </div>
  <setting-dialog v-model:visible="setting" page />
  <about-dialog v-model:visible="about" page />
</template>

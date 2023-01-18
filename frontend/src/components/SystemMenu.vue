<script lang="ts" setup>

</script>

<template>
  <div flex justify-start>
    <v-btn variant="text">
      {{ $t('systemMenu.help') }}
      <v-menu location="bottom" transition="slide-y-transition" activator="parent" width="100" eager>
        <v-list>
          <v-list-item value="about" :active="false">
            {{ $t('systemMenu.about') }}
            <about />
          </v-list-item>
        </v-list>
      </v-menu>
    </v-btn>
  </div>
</template>

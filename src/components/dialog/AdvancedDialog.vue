<script setup lang="ts">
const props = withDefaults(defineProps<{
  visible: boolean
  title: string
  page?: boolean
}>(), {
  page: false,
})

const { visible: visibleVModel } = useVModels(props)
</script>

<template>
  <v-dialog
    v-model="visibleVModel" v-bind="{
      width: props.page ? '' : 400,
      fullscreen: props.page,
      scrim: !props.page,
    }"
  >
    <v-card>
      <v-toolbar v-if="props.page" class="bg-transparent!">
        <v-btn icon="mdi-arrow-left" @click="visibleVModel = false" />
        <v-toolbar-title>{{ props.title }}</v-toolbar-title>
      </v-toolbar>
      <v-card-title v-if="!props.page">
        {{ props.title }}
      </v-card-title>
      <slot />
    </v-card>
  </v-dialog>
</template>

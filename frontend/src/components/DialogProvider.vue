<script lang="ts" setup>
const { list } = $(useDialogStore())
</script>

<template>
  <v-dialog v-for="{ id, props } in list" :key="id" v-model="props.modelValue">
    <v-card>
      <v-card-title>
        <span class="text-h5">Use Google's location service?</span>
      </v-card-title>
    </v-card>
  </v-dialog>
</template>


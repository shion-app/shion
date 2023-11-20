<script setup lang="ts">

</script>

<template>
  <grid :items="[]" :component-props="[]">
    <template #default="{ componentProps }">
      <div v-bind="componentProps">
        123
      </div>
    </template>
  </grid>
</template>

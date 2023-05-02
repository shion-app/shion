<script setup lang="ts">
defineProps<{
  model: {
    [key: string]: any
  }
}>()

defineEmits(['finish', 'cancel'])
</script>

<template>
  <a-form :model="model" autocomplete="off" :label-col="{ style: { width: '100px' } }" @finish="() => $emit('finish')">
    <slot />
    <a-form-item class="mb-0!">
      <div flex>
        <div flex-1 />
        <a-button html-type="button" mr-4 @click="() => $emit('cancel')">
          {{ $t('modal.cancel') }}
        </a-button>
        <a-button html-type="submit" type="primary">
          {{ $t('modal.submit') }}
        </a-button>
      </div>
    </a-form-item>
  </a-form>
</template>

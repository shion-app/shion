<script setup lang="ts">
const { setMenu } = useMore()
const { t } = useI18n()
useConfig()

const planCreateVisible = ref(false)

setMenu(() => [
  {
    key: 'createPlan',
    title: t('plan.create'),
    click() {
      planCreateVisible.value = true
    },
  },
])
</script>

<template>
  <plan-create v-model:visible="planCreateVisible" />
</template>

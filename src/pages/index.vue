<script setup lang="ts">
const { setMenu } = useMore()
const { t } = useI18n()
useConfig()

watchEffect(() => {
  setMenu([
    {
      key: 'createPlan',
      title: t('plan.create'),
    },
  ])
})

onUnmounted(() => setMenu([]))
</script>

<template>
  plan
</template>

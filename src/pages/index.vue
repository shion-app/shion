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

onScopeDispose(() => setMenu([]))
</script>

<template>
  plan
</template>

<script setup lang="ts">
const { setMenu } = useMore()
const { t } = useI18n()
useConfig()

const planCreateVisible = ref(false)

watchEffect(() => {
  setMenu([
    {
      key: 'createPlan',
      title: t('plan.create'),
      click() {
        planCreateVisible.value = true
      },
    },
  ])
})

onUnmounted(() => setMenu([]))
</script>

<template>
  <plan-create v-model:visible="planCreateVisible" />
</template>

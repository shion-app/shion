<script lang="ts" setup>
const { confirm } = useDialog()
const { t } = useI18n()

let isShow = $ref(false)

async function upgradeConfirm() {
  const version = await CheckUpgrade()

  if (version) {
    const ok = await confirm({
      title: t('dialog.tip'),
      content: t('upgrade.tip', {
        version,
      }),
      width: 300,
    })
    if (ok) {
      isShow = true
      Upgrade()
    }
  }
}

upgradeConfirm()
</script>

<template>
  <upgrade v-model:show="isShow" />
</template>

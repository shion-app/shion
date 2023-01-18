<script lang="ts" setup>
const { confirm } = useDialog()
const { t, locale } = useI18n()
const { read } = useConfig()

let isShow = $ref(false)

async function readConfig() {
  const data = await GetConfig()
  locale.value = data.locale
  read(data)
}

async function upgradeConfirm() {
  await readConfig()
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

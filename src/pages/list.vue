<script setup lang="ts">
import PageLabel from '@/components/page/PageLabel.vue'
import PagePlan from '@/components/page/PagePlan.vue'

const { t } = useI18n()

const tab = ref('ref')

const list = computed(() => [
  {
    title: t('nav.plan'),
    value: 'plan',
  },
  {
    title: t('nav.label'),
    value: 'label',
  },
])

const component = computed(() => {
  switch (tab.value) {
    case 'plan':
      return PagePlan
    case 'label':
      return PageLabel
  }
})
</script>

<template>
  <div h-full flex flex-col>
    <div>
      <v-tabs v-model="tab" grow>
        <v-tab v-for="{ title, value } in list" :key="value" :value="value">
          {{ title }}
        </v-tab>
      </v-tabs>
    </div>

    <div flex-1>
      <v-window v-model="tab" h-full>
        <v-window-item v-for="{ value } in list" :key="value" :value="value" h-full>
          <component :is="component" v-if="value == tab" />
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup lang="ts">
import { emitter } from '@/plugins/mitt'

const isShowMenu = ref(false)

emitter.on('toggle-more-menu', v => isShowMenu.value = v)

const { t } = useI18n()
const router = useRouter()

const menu = computed(() => [{
  icon: 'i-mdi:eye-outline',
  activeIcon: 'i-mdi:eye',
  name: t('nav.overview'),
  to: '/',
}, {
  icon: 'i-mdi:list-box-outline',
  activeIcon: 'i-mdi:list-box',
  name: t('nav.plan'),
  to: '/plan',
}, {
  icon: 'i-mdi:label-outline',
  activeIcon: 'i-mdi:label',
  name: t('nav.label'),
  to: '/label',
}, {
  icon: 'i-mdi:timer-outline',
  activeIcon: 'i-mdi:timer',
  name: t('nav.time'),
  to: '/timer',
}, {
  icon: 'i-mdi:application-brackets-outline',
  activeIcon: 'i-mdi:application-brackets',
  name: t('nav.monitor'),
  to: '/monitor',
}, {
  icon: 'i-mdi:lightning-bolt-outline',
  activeIcon: 'i-mdi:lightning-bolt',
  name: t('nav.moment'),
  to: '/moment',
}])

function goBack() {
  router.back()
}
</script>

<template>
  <div h-full flex flex-col justify-between items-center py-2>
    <v-btn icon variant="text" size="small" invisible>
      <div i-mdi:arrow-left text-6 @click="goBack" />
    </v-btn>
    <div space-y-2>
      <router-link
        v-for="{ icon, activeIcon, name, to } in menu" :key="icon" v-slot="{ isActive }"
        :to="to"
        block w-20 text-center
      >
        <v-btn variant="text" rounded :active="isActive" size="small">
          <div :class="[isActive ? activeIcon : icon]" text-6 />
          <v-tooltip
            v-if="!isActive"
            activator="parent"
          >
            {{ name }}
          </v-tooltip>
        </v-btn>
        <div
          text-3.5 mt-1
          :class="{
            invisible: !isActive,
          }"
        >
          {{ name }}
        </div>
      </router-link>
    </div>
    <v-btn
      id="more-menu" icon variant="text" size="small" :class="{
        invisible: !isShowMenu,
      }"
    >
      <div i-mdi:menu text-6 />
    </v-btn>
  </div>
</template>

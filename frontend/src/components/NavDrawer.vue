<script lang="ts" setup>
const drawer = $ref(true)

const { t } = useI18n()
const route = useRoute()

const list = $ref([{
  icon: 'i-mdi:view-grid',
  key: 'record',
  tip: t('nav.record'),
  to: '/',
}, {
  icon: 'i-mdi:clock',
  key: 'clock',
  tip: t('nav.clock'),
  to: '/clock',
}, {
  icon: 'i-mdi:cog',
  key: 'setting',
  tip: t('nav.setting'),
  to: '/setting',
}])

const isShowMenu = $computed(() => list.map(({ to }) => to).includes(route.path))
</script>

<template>
  <v-layout h-full>
    <system-bar />
    <v-navigation-drawer
      v-model="drawer"
      rail
      rail-width="64"
      permanent
    >
      <div flex flex-col h-full items-center>
        <v-list nav>
          <v-list-item v-for="{ icon, key, tip, to } in list" :key="key" :value="key" :to="to">
            <div text-8 :class="icon">
              <v-tooltip
                activator="parent"
                location="end"
              >
                {{ tip }}
              </v-tooltip>
            </div>
          </v-list-item>
        </v-list>
        <div flex-grow />
        <v-btn v-if="isShowMenu" id="extra-menu" icon mb-4>
          <div i-mdi:dots-vertical text-6 />
        </v-btn>
      </div>
    </v-navigation-drawer>
    <v-main>
      <slot />
    </v-main>
  </v-layout>
</template>

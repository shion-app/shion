<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const moreStore = useMore()
const updateStore = useUpdate()
const timeStore = useTime()
// const { sync } = useSync()

const { menu: moreMenu } = storeToRefs(moreStore)
const { precent, downloading } = storeToRefs(updateStore)
const { running: timerRunning } = storeToRefs(timeStore)

const { handleClick } = moreStore

const menu = computed(() => [{
  icon: 'i-mdi:eye',
  key: 'index',
  tip: t('nav.overview'),
  to: '/',
}, {
  icon: 'i-mdi:format-list-bulleted-type',
  key: 'plan',
  tip: t('nav.plan'),
  to: '/plan',
}, {
  icon: 'i-mdi:label',
  key: 'label',
  tip: t('nav.label'),
  to: '/label',
}, {
  icon: 'i-mdi:clock',
  key: 'time',
  tip: t('nav.time'),
  to: '/time',
}, {
  icon: 'i-mdi:monitor',
  key: 'monitor',
  tip: t('nav.monitor'),
  to: '/monitor',
}, {
  icon: 'i-mdi:cog',
  key: 'config',
  tip: t('nav.config'),
  to: '/config',
}, {
  icon: 'i-mdi:information',
  key: 'about',
  tip: t('nav.about'),
  to: '/about',
}])

const name = computed(() => route.name as string)

const isShowTimer = computed(() => timerRunning.value && name.value != 'time')
</script>

<template>
  <a-layout h-screen>
    <a-layout>
      <a-layout-sider collapsed :trigger="null" theme="light" collapsed-width="60">
        <a-menu :selected-keys="[name]" flex flex-col h-full space-y-1 @click="handleClick">
          <a-menu-item v-for="{ key, icon, tip, to } in menu" :key="key">
            <template #icon>
              <div :class="icon" scale-150 />
            </template>
            <router-link :to="to">
              {{ tip }}
            </router-link>
          </a-menu-item>
          <div flex-1 />
          <sub-menu v-if="moreMenu.children?.length" :menu="moreMenu" />
        </a-menu>
      </a-layout-sider>
      <a-layout-content overflow-y-auto>
        <slot />
      </a-layout-content>
    </a-layout>
    <a-layout-footer class="px-2! py-0! bg-white! text-4!" h-6 border-t>
      <div
        flex justify-end space-x-1
        class="[&>*]:flex [&>*]:items-center [&>*]:px-1
        [&>*:hover]:cursor-pointer [&>*:hover]:bg-gray-100"
      >
        <a-tooltip v-if="downloading">
          <template #title>
            <span>{{ precent }}%</span>
          </template>
          <div w-20 space-x-2>
            <div i-mdi:download text-6 animate-bounce />
            <a-progress :percent="precent" size="small" :show-info="false" trail-color="#dbdbdb" />
          </div>
        </a-tooltip>
        <!-- <a-tooltip>
          <template #title>
            <span>{{ $t('sync.title') }}</span>
          </template>
          <div>
            <div i-mdi:sync text-5 @click="sync" />
          </div>
        </a-tooltip> -->
        <a-tooltip v-if="isShowTimer">
          <template #title>
            <span>{{ $t('timer.timing') }}</span>
          </template>
          <display />
        </a-tooltip>
      </div>
    </a-layout-footer>
  </a-layout>
</template>

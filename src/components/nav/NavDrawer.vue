<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const moreStore = useMore()
const updateStore = useUpdate()

const { menu: moreMenu } = storeToRefs(moreStore)
const { precent, downloading } = storeToRefs(updateStore)

const { handleClick } = moreStore

const menu = computed(() => [{
  icon: 'i-mdi:view-grid',
  key: 'index',
  tip: t('nav.plan'),
  to: '/',
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
  icon: 'i-mdi:cog',
  key: 'config',
  tip: t('nav.config'),
  to: '/config',
}])

const name = computed(() => route.name as string)
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
        v-if="downloading"
        flex justify-end space-x-1
        class="[&>*]:flex [&>*]:items-center [&>*]:px-1
        [&>*:hover]:cursor-pointer [&>*:hover]:bg-gray-100"
      >
        <a-tooltip>
          <template #title>
            <span>{{ precent }}%</span>
          </template>
          <div w-20 space-x-2>
            <div i-mdi:download text-6 animate-bounce />
            <a-progress :percent="precent" size="small" :show-info="false" trail-color="#dbdbdb" />
          </div>
        </a-tooltip>
      </div>
    </a-layout-footer>
  </a-layout>
</template>

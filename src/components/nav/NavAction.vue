<script setup lang="ts">
withDefaults(defineProps<{
  vertical?: boolean
  navText?: boolean
}>(), {
  vertical: false,
  navText: false,
})

const router = useRouter()
const navStore = useNavStore()

const { expanded, submenu, menu } = storeToRefs(navStore)

const { openSubmenu } = navStore

function goBack() {
  router.back()
}

function id(key: string) {
  return `nav-${key}`
}
</script>

<template>
  <nav-drawer v-model="expanded">
    <div
      h-full flex justify-between items-center py-2 :class="{
        'flex-col': $props.vertical,
      }"
    >
      <v-btn v-show="$props.vertical" icon variant="text" size="small" invisible>
        <div i-mdi:arrow-left text-6 @click="goBack" />
      </v-btn>
      <div :class="$props.vertical ? ['space-y-6'] : ['flex', 'flex-1', 'justify-around', 'h-full', 'items-center']">
        <router-link
          v-for="{ icon, activeIcon, name, to, key } in menu" :id="id(key)" :key="key"
          v-slot="{ isActive }" :to="to" block w-20 text-center @mouseenter="openSubmenu(key)"
        >
          <v-btn variant="text" rounded :color="isActive ? 'primary' : ''" size="small">
            <div :class="[isActive ? activeIcon : icon]" text-7 />
          </v-btn>
          <div
            v-if="$props.navText" text-3.5 mt-1 :class="{
              'text-primary': isActive,
            }"
          >
            {{ name }}
          </div>
        </router-link>
      </div>
      <div v-show="$props.vertical">
        <slot />
      </div>
    </div>
    <template #menu>
      <v-list>
        <router-link
          v-for="{ icon, activeIcon, name, to, key } in submenu" :id="id(key)" :key="key" v-slot="{ isActive }"
          :to="to"
        >
          <v-list-item :value="key" :title="name" color="primary" :active="isActive">
            <template #prepend>
              <div :class="[isActive ? activeIcon : icon]" text-5 mr-4 />
            </template>
          </v-list-item>
        </router-link>
      </v-list>
    </template>
  </nav-drawer>
</template>

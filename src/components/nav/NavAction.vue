<script setup lang="ts">
interface NavButton {
  icon: string
  activeIcon: string
  name: string
  to: string
  key: string
}

withDefaults(defineProps<{
  vertical?: boolean
  navText?: boolean
  menu: NavButton[]
}>(), {
  vertical: false,
  navText: false,
})

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<template>
  <div
    h-full flex justify-between items-center py-2 :class="{
      'flex-col': $props.vertical,
    }"
  >
    <v-btn v-show="$props.vertical" icon variant="text" size="small" invisible>
      <div i-mdi:arrow-left text-6 @click="goBack" />
    </v-btn>
    <div
      :class="$props.vertical ? ['space-y-1'] : ['flex', 'flex-1', 'justify-around', 'h-full', 'items-center']"
    >
      <router-link
        v-for="{ icon, activeIcon, name, to, key } in $props.menu" :id="key" :key="key" v-slot="{ isActive }"
        :to="to"
        block w-20 text-center
      >
        <v-btn variant="text" rounded :color="isActive ? 'primary' : ''" size="small">
          <div :class="[isActive ? activeIcon : icon]" text-7 />
          <v-tooltip
            v-if="!isActive"
            activator="parent"
          >
            {{ name }}
          </v-tooltip>
        </v-btn>
        <div
          v-if="$props.navText"
          text-3.5 mt-1
          :class="{
            'invisible': !isActive,
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
</template>

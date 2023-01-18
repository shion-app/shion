<script lang="ts" setup>
import logo from '../../../build/appicon.png'

const { config } = useConfig()

let version = $ref('')
let isShow = $ref(false)

const disabled = $computed(() => version.length === 0)

async function checkUpgrade() {
  version = await CheckUpgrade()
}

checkUpgrade()

function upgradeVersion() {
  isShow = true
  Upgrade()
}
</script>

<template>
  <v-dialog width="400" activator="parent">
    <v-sheet class="flex!" p-4 flex-col items-center space-y-2>
      <img :src="logo" alt="logo" w-16 h-16>
      <div text-6>
        shion
      </div>
      <div>
        {{ $t('about.current', {
          version: `v${config.version}`,
        }) }}
      </div>
      <div v-if="disabled">
        {{ $t('about.alreadyLasest') }}
      </div>
      <template v-else>
        <div>
          {{ $t('about.lasest', {
            version,
          }) }}
        </div>
        <v-btn @click="upgradeVersion">
          {{ $t('about.upgrade') }}
        </v-btn>
      </template>
    </v-sheet>
  </v-dialog>
  <upgrade :show="isShow" />
</template>
